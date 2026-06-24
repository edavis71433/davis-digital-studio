from bs4 import BeautifulSoup
import re, glob, os

# Pages to include (skip utility/test/admin pages and the portal apps)
SKIP = {'function-test.html','email-signature.html','email-nurture-sequence.html',
        'dds-studio-manage-9k2p.html','portal.html','set-password.html','404.html',
        'report-card.html'}

# Friendly page titles
def page_label(fn, soup):
    t = soup.find('title')
    return (t.get_text().split('|')[0].strip() if t else fn)

def visible_text(soup):
    # remove non-content
    for tag in soup(['script','style','noscript','svg','head']):
        tag.decompose()
    # collect text blocks preserving rough structure
    blocks=[]
    for el in soup.find_all(['h1','h2','h3','h4','p','li','a','span','div','button']):
        # only leaf-ish elements with direct text
        txt = el.get_text(' ', strip=True)
        if not txt: continue
        # skip if this element's text is just its children repeated (avoid dupes): take only elements whose own text differs
        blocks.append((el.name, txt))
    return blocks

files = sorted([f for f in glob.glob('*.html') if f not in SKIP])
print("PAGES TO INCLUDE:", len(files))
for f in files:
    print(" ", f)
