"""
Convert markdown report to PDF
Requires: pip install markdown2 weasyprint
"""
import markdown2
from weasyprint import HTML, CSS
from pathlib import Path

def convert_md_to_pdf(md_file, pdf_file):
    # Read markdown
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Convert to HTML
    html_content = markdown2.markdown(md_content, extras=['tables', 'fenced-code-blocks'])
    
    # Add CSS styling
    css = CSS(string='''
        @page { size: A4; margin: 2cm; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 20px; }
        h3 { color: #7f8c8d; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #3498db; color: white; }
        ul, ol { margin-left: 20px; }
    ''')
    
    # Create full HTML document
    full_html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Day 2-4 Progress Report</title>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    '''
    
    # Convert to PDF
    HTML(string=full_html).write_pdf(pdf_file, stylesheets=[css])
    print(f"✅ PDF created: {pdf_file}")

if __name__ == '__main__':
    convert_md_to_pdf('Day_2-4_Progress_Report.docx.md', 'Day_2-4_Progress_Report.pdf')
