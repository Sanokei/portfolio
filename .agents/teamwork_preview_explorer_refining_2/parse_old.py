import re

with open("old_index_utf8.html", "r", encoding="utf-8") as f:
    text = f.read()

# Let's find project-title divs or similar headings
titles = re.findall(r'class="project-title[^"]*">(.*?)</div>', text)
print("PROJECTS IN OLD INDEX.HTML:")
for title in titles:
    print(title)

# Also let's extract all hrefs to see what links are there
hrefs = re.findall(r'href="([^"]+)"', text)
print("\nLINKS IN OLD INDEX.HTML:")
for href in set(hrefs):
    print(href)
