from bs4 import BeautifulSoup
import re, glob, json

SKIP = {'function-test.html','email-signature.html','email-nurture-sequence.html',
        'dds-studio-manage-9k2p.html','portal.html','set-password.html','404.html'}
LEGAL = {'privacy.html','terms.html','accessibility.html'}

def clean_page(fn):
    h = open(fn, encoding='utf-8').read()
    soup = BeautifulSoup(h, 'html.parser')
    title = soup.find('title')
    title = title.get_text().strip() if title else fn
    meta = soup.find('meta', attrs={'name':'description'})
    meta = meta.get('content','').strip() if meta else ''
    # remove non-content + structural chrome
    for tag in soup(['script','style','noscript','svg','head']):
        tag.decompose()
    # remove nav, header, footer (repeated chrome)
    for sel in ['nav','header','footer']:
        for el in soup.find_all(sel):
            el.decompose()
    for el in soup.find_all(attrs={'class': re.compile(r'(nav|footer|header|cookie|exit-intent|popup|sticky-bar|breadcrumb)', re.I)}):
        el.decompose()
    body = soup.find('body') or soup
    # walk and collect headings + paragraphs + list items + buttons/links that are CTAs
    seen=set()
    out=[]
    for el in body.find_all(['h1','h2','h3','h4','p','li']):
        txt = el.get_text(' ', strip=True)
        txt = re.sub(r'\s+',' ',txt)
        if len(txt) < 2: continue
        key = (el.name, txt)
        if txt in seen: continue
        seen.add(txt)
        out.append((el.name, txt))
    return {'file':fn,'title':title,'meta':meta,'blocks':out}

files = sorted([f for f in glob.glob('*.html') if f not in SKIP])
data=[clean_page(f) for f in files]
json.dump(data, open('site_copy.json','w'), ensure_ascii=False)
# quick stats
for d in data:
    print(f"{d['file']:38} {len(d['blocks']):3} blocks  | {d['title'][:45]}")
