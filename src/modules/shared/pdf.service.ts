import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';
import { formatThaiDate } from 'src/common/utils/dates';
import { toThaiBath } from 'src/common/utils/numbers';
import { policyStatusMap } from 'src/modules/policies/constants';
import { PolicyAssociationDTO } from 'src/modules/policies/dto/association.dto';
import * as handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  private templatePath = path.resolve('templates', 'pdf', 'policy.hbs');

  constructor() {
    handlebars.registerHelper('inc', function (value) {
      return parseInt(value) + 1;
    });
  }

  generatePolicyPdfStream(policy: PolicyAssociationDTO): PDFKit.PDFDocument {
    const doc = new PDFDocument();

    // Register Thai Font
    doc.registerFont('NotoSansThai', path.resolve('fonts', 'NotoSansThai.ttf'));
    doc.font('NotoSansThai');

    this._generatePolicyPdfContent(doc, policy);

    doc.end();
    return doc;
  }

  async generatePolicyPdf(policy: PolicyAssociationDTO): Promise<Buffer> {
    const html = await this.generateHtml(policy);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm' },
    });

    await browser.close();

    return pdf as Buffer;
  }

  private async generateHtml(policy: PolicyAssociationDTO): Promise<string> {
    const templateSource = fs.readFileSync(this.templatePath, 'utf8');

    const template = handlebars.compile(templateSource);

    const preparedData = {
      ...policy,
      statusText: policyStatusMap[policy.status],
      sumInsuredText: toThaiBath(+policy.sumInsured),
      premiumAmountText: toThaiBath(+policy.premiumAmount) + ' / ปี',
      startDateText: formatThaiDate(policy.startDate),
      endDateText: formatThaiDate(policy.endDate),

      healthInfo: {
        smoking: policy.healthInfo.smoking ? 'ใช่' : 'ไม่',
        drinking: policy.healthInfo.drinking ? 'ใช่' : 'ไม่',
        detail: policy.healthInfo.detail || '-',
      },
    };

    return template(preparedData);
  }

  private _generatePolicyPdfContent(
    doc: PDFKit.PDFDocument,
    policy: PolicyAssociationDTO,
  ) {
    const { customer, beneficiaries, healthInfo } = policy;

    // Header
    doc.fontSize(20).text('เอกสารกรมธรรม์ประกัน', { underline: true });
    doc.moveDown();

    // Policy Summary
    doc.fontSize(14).text(`เลขที่กรมธรรม์: ${policy.no}`);
    doc.text(`ชื่อแผนประกัน: ${policy.name}`);
    doc.text(`รายละเอียดความคุ้มครอง: ${policy.coverageDetails}`);
    doc.text(`สถานะ: ${policyStatusMap[policy.status]}`);
    doc.text(`ทุนประกัน: ${toThaiBath(+policy.sumInsured)}`);
    doc.text(`ค่าเบี้ยประกัน: ${toThaiBath(+policy.premiumAmount)} / ปี`);
    doc.text(`วันที่เริ่มคุ้มครอง: ${formatThaiDate(policy.startDate)}`);
    doc.text(`วันที่สิ้นสุดคุ้มครอง: ${formatThaiDate(policy.endDate)}`);
    doc.moveDown();

    // Customer Section
    doc.fontSize(16).text('ข้อมูลผู้เอาประกัน', { underline: true });
    doc.fontSize(14);
    doc.text(`ชื่อ–นามสกุล: ${customer.firstName} ${customer.lastName}`);
    doc.text(`อีเมล: ${customer.email}`);
    doc.text(`เบอร์โทรศัพท์: ${customer.phone ?? '-'}`);
    doc.moveDown();

    // Health Info
    doc.fontSize(16).text('ข้อมูลสุขภาพผู้เอาประกัน', { underline: true });
    doc.fontSize(14);
    doc.text(`สูบบุหรี่: ${healthInfo.smoking ? 'ใช่' : 'ไม่'}`);
    doc.text(`ดื่มแอลกอฮอล์: ${healthInfo.drinking ? 'ใช่' : 'ไม่'}`);
    doc.text(`รายละเอียดเพิ่มเติม: ${healthInfo.detail || '-'}`);
    doc.moveDown();

    // Beneficiaries
    doc.fontSize(16).text('ข้อมูลผู้รับผลประโยชน์', { underline: true });
    beneficiaries.forEach((b, index) => {
      doc
        .fontSize(14)
        .text(
          `${index + 1}) ${b.firstName} ${b.lastName} (${b.relationship}) - สัดส่วนรับผลประโยชน์ ${b.percentage}%`,
        );
    });
    doc.moveDown();
  }
}
