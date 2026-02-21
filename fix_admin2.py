with open("/home/vzor/vzor/config/nginx/www/admin.html", "r") as f:
    code = f.read()

# 1. Add CSS for .row-actions, .dbtn.wa, .dbtn.tg
old_css = ".empty { text-align:center; color:var(--text3); padding:48px; font-size:12px; letter-spacing:2px; }"
new_css = """.row-actions { display:flex; gap:6px; align-items:center; flex-shrink:0; }
.dbtn.wa { color:#25D366; border-color:rgba(37,211,102,0.2); }
.dbtn.wa:hover { border-color:#25D366; background:rgba(37,211,102,0.08); }
.dbtn.tg { color:#29B6F6; border-color:rgba(41,182,246,0.2); }
.dbtn.tg:hover { border-color:#29B6F6; background:rgba(41,182,246,0.08); }
.empty { text-align:center; color:var(--text3); padding:48px; font-size:12px; letter-spacing:2px; }"""
code = code.replace(old_css, new_css)
print("1. CSS added")

# 2. Fix copyCode -> copyGuestLink (rename in the button)
code = code.replace(
    "copyCode('+g.id+',&#39;'+esc(g.access_code)+'&#39;)\">Copy code</button>",
    "copyGuestLink('+g.id+',&#39;'+esc(g.access_code)+'&#39;)\">Copy</button>"
)
print("2. copyCode fixed")

# 3. Replace shareAll buttons with 4 proper buttons: WA link, WA QR, TG link, TG QR
old_share = """+'<button class="dbtn wa" onclick="event.stopPropagation();shareAll('+g.id+',&#39;'+esc(g.access_code)+'&#39;,&#39;whatsapp&#39;)">WhatsApp</button>'
            +'<button class="dbtn tg" onclick="event.stopPropagation();shareAll('+g.id+',&#39;'+esc(g.access_code)+'&#39;,&#39;telegram&#39;)">Telegram</button>'"""
new_share = """+'<button class="dbtn wa" onclick="event.stopPropagation();shareGuestWA(&#39;'+esc(g.access_code)+'&#39;)">WA link</button>'
            +'<button class="dbtn wa" onclick="event.stopPropagation();shareQRImage('+g.id+',&#39;'+esc(g.access_code)+'&#39;,&#39;WhatsApp&#39;)">WA QR</button>'
            +'<button class="dbtn tg" onclick="event.stopPropagation();shareGuestTG(&#39;'+esc(g.access_code)+'&#39;)">TG link</button>'
            +'<button class="dbtn tg" onclick="event.stopPropagation();shareQRImage('+g.id+',&#39;'+esc(g.access_code)+'&#39;,&#39;Telegram&#39;)">TG QR</button>'"""
code = code.replace(old_share, new_share)
print("3. Share buttons fixed (4 buttons)")

# 4. Fix copyGuestLink to use the code (not fullurl) and show "Copied!"
old_copy_fn = """function copyGuestLink(id,code){
    navigator.clipboard.writeText(fullurl(code));
    var b=document.getElementById("cl-"+id);
    if(b){ b.textContent="Copied!"; b.classList.add("done"); setTimeout(function(){ b.textContent="Copy link"; b.classList.remove("done"); },1500); }
}"""
new_copy_fn = """function copyGuestLink(id,code){
    navigator.clipboard.writeText(code+" \\n"+fullurl(code));
    var b=document.getElementById("cl-"+id);
    if(b){ b.textContent="Copied!"; b.classList.add("done"); setTimeout(function(){ b.textContent="Copy"; b.classList.remove("done"); },1500); }
}"""
code = code.replace(old_copy_fn, new_copy_fn)
print("4. copyGuestLink copies code+link")

with open("/home/vzor/vzor/config/nginx/www/admin.html", "w") as f:
    f.write(code)

print("All done!")
