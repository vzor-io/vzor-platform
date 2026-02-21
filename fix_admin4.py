with open("/home/vzor/vzor/config/nginx/www/admin.html", "r") as f:
    code = f.read()

# 1. Fix shareQRImage - just download QR, no app opening
old_fn = r"""async function shareQRImage(guestId, code, platform){
    var r=await fetch("/api/admin/guests",{headers:{"X-Admin-Secret":S}});
    var d=await r.json();
    var g=(d.guests||[]).find(function(x){return x.id===guestId;});
    if(!g) return;
    var qr=makeQRhd(tokenUrl(g.token));
    var blob=await qr.getRawData("png");
    if(!blob) return;
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url; a.download="VZOR-"+sc(code)+".png"; a.click();
    URL.revokeObjectURL(url);
    setTimeout(function(){
        if(platform==="Telegram"){
            window.open("https://t.me/share/url?url="+encodeURIComponent(fullurl(code))+"&text="+encodeURIComponent("VZOR access: "+code+" (QR attached)"),"_blank");
        } else {
            window.open("https://wa.me/?text="+encodeURIComponent("VZOR access\n\nCode: "+code+"\n"+fullurl(code)+"\n\n(QR attached)"),"_blank");
        }
    }, 500);
}"""

new_fn = """async function shareQRImage(guestId, code, platform){
    var r=await fetch("/api/admin/guests",{headers:{"X-Admin-Secret":S}});
    var d=await r.json();
    var g=(d.guests||[]).find(function(x){return x.id===guestId;});
    if(!g) return;
    var qr=makeQRhd(tokenUrl(g.token));
    var blob=await qr.getRawData("png");
    if(!blob) return;
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url; a.download="VZOR-"+sc(code)+".png"; a.click();
    URL.revokeObjectURL(url);
}"""

if old_fn in code:
    code = code.replace(old_fn, new_fn)
    print("1. shareQRImage fixed (download only)")
else:
    print("1. ERROR: shareQRImage not found")

# 2. Fix shareResultQR - just download QR
old_result = r"""async function shareResultQR(platform){
    if(!lastCreated) return;
    var code=lastCreated.access_code;
    var qr=makeQRhd(tokenUrl(lastCreated.guest.token));
    var blob=await qr.getRawData("png");
    if(!blob) return;
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url; a.download="VZOR-"+sc(code)+".png"; a.click();
    URL.revokeObjectURL(url);
    setTimeout(function(){
        if(platform==="Telegram"){
            window.open("https://t.me/share/url?url="+encodeURIComponent(fullurl(code))+"&text="+encodeURIComponent("VZOR access: "+code+" (QR attached)"),"_blank");
        } else {
            window.open("https://wa.me/?text="+encodeURIComponent("VZOR access\n\nCode: "+code+"\n"+fullurl(code)+"\n\n(QR attached)"),"_blank");
        }
    }, 500);
}"""

new_result = """async function shareResultQR(platform){
    if(!lastCreated) return;
    var code=lastCreated.access_code;
    var qr=makeQRhd(tokenUrl(lastCreated.guest.token));
    var blob=await qr.getRawData("png");
    if(!blob) return;
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url; a.download="VZOR-"+sc(code)+".png"; a.click();
    URL.revokeObjectURL(url);
}"""

if old_result in code:
    code = code.replace(old_result, new_result)
    print("2. shareResultQR fixed (download only)")
else:
    print("2. ERROR: shareResultQR not found")

# 3. Clean up TG link and WA link messages
old_tg = 'function shareGuestTG(code){ window.open("https://t.me/share/url?url="+encodeURIComponent(fullurl(code))+"&text="+encodeURIComponent("VZOR access code: "+code),"_blank"); }'
new_tg = 'function shareGuestTG(code){ window.open("https://t.me/share/url?url="+encodeURIComponent(fullurl(code))+"&text="+encodeURIComponent("VZOR\\nCode: "+code),"_blank"); }'
code = code.replace(old_tg, new_tg)
print("3. TG link text cleaned")

old_wa = 'function shareGuestWA(code){ window.open("https://wa.me/?text="+encodeURIComponent("VZOR — private access\\n\\nCode: "+code+"\\n"+fullurl(code)),"_blank"); }'
new_wa = 'function shareGuestWA(code){ window.open("https://wa.me/?text="+encodeURIComponent("VZOR\\nCode: "+code+"\\n"+fullurl(code)),"_blank"); }'
code = code.replace(old_wa, new_wa)
print("4. WA link text cleaned")

with open("/home/vzor/vzor/config/nginx/www/admin.html", "w") as f:
    f.write(code)

print("Done!")
