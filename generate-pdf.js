const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        const htmlPath = path.join(__dirname, 'ijaz_resume.html');
        await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
        
        await page.pdf({
            path: 'Shaik_Ijaz_Ahammad_Resume.pdf',
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0.4in',
                right: '0.4in',
                bottom: '0.4in',
                left: '0.4in'
            }
        });
        
        await browser.close();
        console.log('✅ PDF generated successfully: Shaik_Ijaz_Ahammad_Resume.pdf');
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
    }
}

generatePDF();