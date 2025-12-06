import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { formatThaiDate } from 'src/common/utils/dates';
import { toThaiBath } from 'src/common/utils/numbers';
import { policyStatusMap } from 'src/modules/policies/constants';
import { PolicyAssociationDTO } from 'src/modules/policies/dto/association.dto';
import * as handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import { Readable } from 'stream';

@Injectable()
export class PdfService {
  private templatePath = path.resolve('templates', 'pdf', 'policy.hbs');

  constructor() {
    handlebars.registerHelper('inc', function (value) {
      return parseInt(value) + 1;
    });
  }

  async generatePolicyPdfStream(
    policy: PolicyAssociationDTO,
  ): Promise<Readable> {
    const buffer = await this.generatePolicyPdf(policy);

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    return stream;
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
}
