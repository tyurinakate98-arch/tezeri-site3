"""Prepare a clean GitHub Pages artifact; used as tools/prepare_pages.py in the ZIP."""
import json
import os
import shutil
from pathlib import Path
from configure_seo import configure

root=Path.cwd().resolve()
output=root/'_site'
output.mkdir(exist_ok=True)
manifest=json.loads((root/'page-manifest.json').read_text(encoding='utf-8'))
files=list(manifest)+['site.css','site.js','page-manifest.json','robots.txt','.nojekyll']
for name in files:
    source=root/name
    if source.is_file(): shutil.copy2(source,output/name)
shutil.copytree(root/'assets',output/'assets',dirs_exist_ok=True)
result=configure(output,os.environ['SITE_URL'],os.environ.get('PUBLIC_INDEXING','').lower()=='true')
print(json.dumps(result,ensure_ascii=False))
