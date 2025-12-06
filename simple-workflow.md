# Workflow ระบบซื้อประกัน

## 1️⃣ เลือกแผนประกัน (Plan Selection)

1. ลูกค้าเปิดเว็บไซต์ เลือกค้นหาจาก:

   * อายุ
   * ทุนประกันขั้นต่ำ
2. Frontend เรียก API:

   ```
   GET /api/v1/plans?age={age}&minSumInsured={amount}
   ```
3. Backend คัดกรองแผนที่ตรงตามเงื่อนไขและส่งรายการกลับ
4. ลูกค้าเลือกแผนที่ต้องการ กดปุ่ม **"ซื้อประกัน"**
5. ระบบพาไปหน้ากรอกใบสมัคร เช่น:

   ```
   /plans/{planId}/application
   ```
6. โหลดข้อมูลแผนที่เลือกมาโชว์บนฟอร์ม:

   ```
   GET /api/v1/plans/{id}
   ```

---

## 2️⃣ กรอกใบสมัคร (Data Entry)

> Frontend เก็บข้อมูลชั่วคราวใน **Session Storage** จนกว่าจะกดยืนยันส่ง

### 2.1 ข้อมูลลูกค้า

* ชื่อ-นามสกุล
* ที่อยู่
* เลขบัตรประชาชน
* เบอร์โทร
* Email
* วันเดือนปีเกิด

(ตรวจสอบ Email ซ้ำ และ อายุกับแผนก่อน submit):

```
POST /api/v1/customers/validate-email
```
```
POST /api/v1/plans/validate-age
```

### 2.2 คำถามสุขภาพ

* สูบบุหรี่หรือไม่
* ดื่มแอลกอฮอล์หรือไม่
* ข้อมูลความเสี่ยงอื่นๆ

### 2.3 ผู้รับผลประโยชน์ (Beneficiaries)

* ชื่อผู้รับประโยชน์
* ความสัมพันธ์
* สัดส่วนผลประโยชน์เป็น `%`

> Frontend ต้องตรวจสอบว่าผลรวม = `100%`

### 2.4 ตรวจสอบข้อมูล (Review)

* แสดงสรุปข้อมูลทั้งหมดให้ลูกค้ายืนยันก่อนส่ง

---

## 3️⃣ ส่งใบสมัคร & ชำระเบี้ย (Submission & Payment)

### 3.1 ส่งใบสมัคร

1. ลูกค้ากด **"ยืนยันใบสมัคร"**
2. Frontend ส่งข้อมูล JSON ไป Backend:

   ```
   POST /api/v1/policies
   ```
3. Backend ทำงาน:

   * ตรวจสอบข้อมูล (Email ไม่ซ้ำ, อายุอยู่ในช่วงแผน, Beneficiaries = 100%)
   * บันทึกลงฐานข้อมูล
   * เพิ่ม job ไปที่ `email_queue` เพื่อส่ง Email แจ้งสถานะ **"รอชำระเบี้ย"**
   * ส่ง `policyId` กลับให้ Frontend
4. Redirect ไปหน้าชำระเงิน เช่น:

   ```
   /policies/{policyId}/payment
   ```

---

### 3.2 ชำระเงินด้วย PromptPay

1. ลูกค้าเลือก **PromptPay**
2. Frontend ขอ QR payment:

   ```
   POST /api/v1/policies/{id}/payments/promptpay
   ```
3. Backend:

   * สร้าง **QR Code PromptPay**
   * บันทึก `transaction reference` และ `expected amount` ใน DB
   * ส่ง QR Code กลับไป Frontend
4. Frontend แสดง QR ให้สแกน
5. Frontend สามารถ:

   * Polling เช็คสถานะทุก 5–10 วินาที ```data.status ต้องมีค่าเป็น 'active'```:

     ```
     GET /api/v1/policies/{id}/status
     ```
   * ปุ่ม **"ตรวจสอบสถานะการชำระเงิน"** สำหรับ manual check

---

### 3.3 Webhook จาก Payment Provider

```
POST /api/payments/webhook
```

หลังรับ webhook Backend จะ:

* ตรวจสอบ `webhook event`
* เพิ่ม job ไปที่ `payment_queue`
* ตรวจสอบ `transaction reference` และ `expected amount`
* อัปเดต status กรมธรรม์ → **มีผลคุ้มครอง**
* เพิ่ม job ไปที่ `email_queue` เพื่อส่งอีเมลพร้อมแนบ PDF กรมธรรม์ให้ลูกค้า

---

## 4️⃣ Admin ดาวน์โหลด PDF กรมธรรม์

> สำหรับกรณีลูกค้าไม่ได้รับ email หรือขอเอกสารซ้ำ

Frontend Admin เรียก API:

```
GET /api/v1/policies/{id}/pdf
```

Backend:

* ตรวจสอบสิทธิ์ role `super_admin` หรือ `admin`
* ดาวน์โหลด PDF

---

## 5️⃣ Admin ส่งอีเมลกรมธรรม์ซ้ำ (Admin Resends Policy Email)

> สำหรับกรณีลูกค้าไม่ได้รับ email หรือขอเอกสารซ้ำ

Frontend Admin เรียก API:

```
POST /api/v1/policies/{id}/email
```

Backend:

* ตรวจสอบสิทธิ์ role `super_admin` หรือ `admin`
* ตรวจสอบว่ากรมธรรม์จ่ายเงินแล้ว
* เพิ่ม job ไปที่ `email_queue` เพื่อส่งอีเมลพร้อมแนบ PDF กรมธรรม์ให้ลูกค้า

---