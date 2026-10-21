"""Compile authored poem explanations into the static site's study data."""
from pathlib import Path
import json, re
ROOT = Path(__file__).resolve().parent.parent
raw=(ROOT/'poems.js').read_text().split('`',2)[1].strip().splitlines()
poems={}
for i,line in enumerate(raw,1):
    grade,term,title,author,dynasty,body=line.split('|')
    poems[title]={'id':f'poem-{i}','lines':body.split('/') if body else [],'modern':dynasty=='现代'}
entries={}
current=None
for number,line in enumerate((ROOT/'content/study-source.txt').read_text().splitlines(),1):
    if not line.strip(): continue
    if line.startswith('@'):
        title,intro,theme=line[1:].split('|')
        assert title in poems, (number,title)
        assert title not in entries, (number,'Duplicate',title)
        current={'title':title,'intro':intro,'theme':theme,'glossary':[],'lines':[]}
        entries[title]=current
    elif not current['glossary']:
        for item in line.split('；'):
            key,meaning=item.split('=',1)
            current['glossary'].append({'word':key,'meaning':meaning})
    else:
        translation,reading=line.split('|')
        current['lines'].append({'translations':translation.split('/'),'reading':reading})
assert set(entries)==set(poems), ('Missing',set(poems)-set(entries))
errors=[]
for title,p in poems.items():
    entry=entries[title]
    if not p['modern']:
        if len(p['lines'])!=len(entry['lines']): errors.append((title,'line count',len(p['lines']),len(entry['lines'])))
        for original,row in zip(p['lines'],entry['lines']):
            clauses=re.findall(r'[^，。？！；]+[，。？！；]?',original)
            if original=='鹅，鹅，鹅，曲项向天歌。': clauses=['鹅，鹅，鹅，','曲项向天歌。']
            if len(clauses)!=len(row['translations']):errors.append((title,original,len(clauses),len(row['translations'])))
            row['clauses']=clauses
    else:
        for i,row in enumerate(entry['lines'],1):row['label']=f'第{i}层意思'
    terms=sorted((g['word'] for g in entry['glossary']),key=len,reverse=True)
    for row in entry['lines']:
        for clause in row.get('clauses',[]):
            at=0
            while at<len(clause):
                if not '\u4e00'<=clause[at]<='\u9fff':
                    at+=1
                    continue
                word=next((word for word in terms if clause.startswith(word,at)),None)
                if not word:
                    errors.append((title,'Missing word explanation',clause[at:]))
                    break
                at+=len(word)
assert not errors, errors
out={poems[title]['id']:entry for title,entry in entries.items()}
(ROOT/'study-data.js').write_text('/* Original learning notes; edit content/study-source.txt and rebuild. */\nwindow.POEM_STUDIES = '+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
print(f'Validated {len(out)} poems, {sum(len(e["lines"]) for e in out.values())} groups, {sum(len(r["translations"]) for e in out.values() for r in e["lines"])} clause explanations and {sum(len(e["glossary"]) for e in out.values())} glossary entries.')
