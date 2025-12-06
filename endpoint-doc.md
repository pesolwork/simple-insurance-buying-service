Endpoints ทั้งหมดจะอยู่ภายใต้ prefix /api/v1/ (ยกเว้น payment webhook)

  ---

  (Authentication) - /auth

   * POST /login (Public): เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
   * POST /otp/request (Public): ขอรหัส OTP เพื่อใช้ในการเข้าสู่ระบบ
   * POST /otp/login (Public): เข้าสู่ระบบด้วยอีเมลและ OTP
   * GET /me (Authenticated): ดึงข้อมูลผู้ใช้งานที่ล็อกอินอยู่
   * POST /refresh-token (Public): ขอ Access Token ใหม่โดยใช้ Refresh Token

  ---

  ลูกค้า (Customers) - /customers

   * GET /profile (Customer): ดึงข้อมูลโปรไฟล์ของลูกค้าที่ล็อกอินอยู่
   * POST /register (Public): ลงทะเบียนลูกค้าใหม่
   * POST /validate-email (Public): ตรวจสอบว่าอีเมลนี้มีในระบบแล้วหรือยัง
   * POST / (Admin/SuperAdmin): สร้างข้อมูลลูกค้า
   * PUT /:id (Admin/SuperAdmin): อัปเดตข้อมูลลูกค้า
   * GET /:id (Admin/SuperAdmin): ดึงข้อมูลลูกค้าตาม ID
   * GET / (Admin/SuperAdmin): ค้นหาข้อมูลลูกค้าทั้งหมด

  ---

  แผนประกัน (Plans) - /plans

   * GET / (Public): ค้นหาแผนประกันทั้งหมด
   * GET /:id (Public): ดึงข้อมูลแผนประกันตาม ID
   * POST /validate (Public): ตรวจสอบเงื่อนไขของแผนประกัน (เช่น อายุของผู้สมัคร)
   * POST / (Admin/SuperAdmin): สร้างแผนประกันใหม่
   * PUT /:id (Admin/SuperAdmin): อัปเดตแผนประกัน

  ---

  กรมธรรม์ (Policies) - /policies

   * POST / (Public): สร้างใบคำขอเอาประกัน (สำหรับลูกค้าใหม่ที่ยังไม่มีบัญชี)
   * POST /associations (Customer): สร้างใบคำขอเอาประกัน (สำหรับลูกค้าที่มีบัญชีอยู่แล้ว)
   * GET /:id (Public): ดึงข้อมูลกรมธรรม์ตาม ID
   * GET /:id/status (Public): ดูสถานะของกรมธรรม์
   * POST /:id/payments/promptpay (Public): สร้าง QR Code สำหรับชำระเงินแบบ PromptPay
   * GET /:id/pdf (Admin/SuperAdmin): ดาวน์โหลดไฟล์ PDF ของกรมธรรม์
   * POST /:id/email (Admin/SuperAdmin): ส่งอีเมลกรมธรรม์ให้ลูกค้า
   * PUT /:id (Admin/SuperAdmin): อัปเดตข้อมูลกรมธรรม์
   * GET / (Admin/SuperAdmin): ค้นหากรมธรรม์ทั้งหมด
   * GET /associations/:view (Admin/SuperAdmin): ค้นหากรมธรรม์พร้อมข้อมูลอื่นๆ (เช่น ข้อมูลลูกค้า, ผู้รับผลประโยชน์)
   * GET /associations/:view/:id (Public): ดึงข้อมูลกรมธรรม์ตาม ID พร้อมข้อมูลอื่นๆ

  ---

  การเคลม (Claims) - /claims

   * POST / (Customer): สร้างรายการเคลมใหม่ (ลูกค้าสามารถสร้างได้เฉพาะของตัวเอง)
   * GET / (Customer/Admin): ดูรายการเคลม (ลูกค้าจะเห็นเฉพาะของตัวเอง)
   * GET /:id (Customer/Admin): ดูรายละเอียดการเคลมตาม ID
   * PUT /:id (Admin/SuperAdmin): อัปเดตสถานะหรือข้อมูลการเคลม
   * GET /associations/:view (Admin/Customer): ค้นหาการเคลมพร้อมข้อมูลอื่นๆ (เช่น ข้อมูลลูกค้า, ข้อมูลกรมธรรม์)
   * GET /associations/:view/:id (Admin/Customer): ดึงข้อมูลการเคลมตาม ID พร้อมข้อมูลอื่นๆ

  ---

  การชำระเงิน (Payments) - /payments

   * POST /webhook (Public): Webhook สำหรับรับการแจ้งเตือนการชำระเงินจาก Payment Gateway (Endpoint นี้ไม่มี prefix /api/v1/)

  ---

  ผู้ใช้งาน (Users) - /users

   * GET / (Admin/SuperAdmin): ค้นหาผู้ใช้งานทั้งหมดในระบบ

  ---

  ข้อมูลอื่นๆ (สำหรับ Admin/SuperAdmin)

   * /beneficiaries: จัดการข้อมูลผู้รับผลประโยชน์
   * /health-infos: จัดการข้อมูลสุขภาพ
   * /transactions: จัดการข้อมูลธุรกรรมการเงิน

  Endpoint เหล่านี้ส่วนใหญ่จะใช้สำหรับการจัดการข้อมูลหลังบ้านโดย Admin และ SuperAdmin ครับ