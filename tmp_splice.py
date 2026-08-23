import io

path = "resources/css/social.css"
with io.open(path, encoding="utf-8") as f:
    lines = f.readlines()

# Content-anchored guards (encoding-robust: match ASCII substring, not the em-dashes).
assert "Stage (live terrace voice rooms)" in lines[6776], repr(lines[6776])
assert lines[8653].strip() == "}", repr(lines[8653])
assert lines[8655].startswith("@media (prefers-reduced-motion"), repr(lines[8655])

with io.open("tmp_stage_css_block.css", encoding="utf-8") as f:
    block = f.read()
if not block.endswith("\n"):
    block += "\n"

out = lines[:6776] + [block] + lines[8654:]
with io.open(path, "w", encoding="utf-8", newline="") as f:
    f.writelines(out)

print("spliced OK; old lines:", len(lines), "new lines:", len(out))
