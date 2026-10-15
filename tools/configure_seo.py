"""Configure static URLs for a real hosting origin, without network access.

Example: python configure_seo.py --root dist --site-url https://owner.github.io/repo/
Add --public only when registration, offer and company details are launch-ready.
"""
import argparse
import html
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

def configure(root: Path, site_url: str, public: bool):
    parsed=urlsplit(site_url)
    if parsed.scheme!='https' or not parsed.netloc or parsed.query or parsed.fragment:
        raise ValueError('Укажите полный HTTPS-адрес сайта без параметров и фрагмента.')
    if parsed.hostname in ['localhost','127.0.0.1','example.com','example.invalid']:
        raise ValueError('Для canonical нужен действительный адрес размещения сайта.')
    base=site_url.rstrip('/')+'/'
    manifest=json.loads((root/'page-manifest.json').read_text(encoding='utf-8'))
    urls=[]
    for filename, meta in manifest.items():
        path=root/filename
        source=path.read_text(encoding='utf-8')
        source=re.sub(r'<!-- TEZERI SEO START -->.*?<!-- TEZERI SEO END -->','',source,flags=re.S)
        robots='index,follow' if public and filename!='404.html' else 'noindex,follow'
        source=re.sub(r'<meta name="robots" content="[^"]*">',f'<meta name="robots" content="{robots}">',source)
        if filename!='404.html':
            url=base+('' if filename=='index.html' else filename)
            urls.append(url)
            page={'@context':'https://schema.org','@type':'WebPage','name':meta['title'],'description':meta['description'],'url':url,'inLanguage':'ru-RU','isPartOf':{'@type':'WebSite','name':'ТЕЗЕРИ','url':base}}
            graph=[page]
            if filename=='index.html':
                graph.append({'@context':'https://schema.org','@type':'SoftwareApplication','name':'ТЕЗЕРИ','applicationCategory':'BusinessApplication','operatingSystem':'Web','url':base,'description':meta['description']})
            if filename!='index.html':
                graph.append({'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'ТЕЗЕРИ','item':base},{'@type':'ListItem','position':2,'name':meta['title'],'item':url}]})
            tags=f'<!-- TEZERI SEO START --><link rel="canonical" href="{html.escape(url,quote=True)}"><meta property="og:url" content="{html.escape(url,quote=True)}"><meta property="og:image" content="{html.escape(base+"assets/media/visualizer-two.webp",quote=True)}"><meta property="og:image:alt" content="3D-проект балкона в программе ТЕЗЕРИ"><script type="application/ld+json">{json.dumps(graph,ensure_ascii=False).replace("<","\\u003c")}</script><!-- TEZERI SEO END -->'
            source=source.replace('</head>',tags+'</head>')
        path.write_text(source,encoding='utf-8')
    xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml+=''.join(f'  <url><loc>{html.escape(url)}</loc></url>\n' for url in urls)+'</urlset>\n'
    (root/'sitemap.xml').write_text(xml,encoding='utf-8')
    # Crawling remains allowed so a crawler can see noindex on the review pages.
    (root/'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {base}sitemap.xml\n',encoding='utf-8')
    return {'site_url':base,'public_indexing':public,'canonical_pages':len(urls)}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parent/'dist')
    parser.add_argument('--site-url',required=True)
    parser.add_argument('--public',action='store_true')
    args=parser.parse_args()
    print(json.dumps(configure(args.root.resolve(),args.site_url,args.public),ensure_ascii=False))
