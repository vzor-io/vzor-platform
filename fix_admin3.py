with open("/home/vzor/vzor/config/nginx/www/admin.html", "r") as f:
    code = f.read()

# Replace shareQRImage function - download QR + open app
old_fn = """async function shareQRImage(guestId, code, platform){
    var r=await fetch("/api/admin/guests",{headers:{"X-Admin-Secret":S}});
    var d=await r.json();
    var g=(d.guests||[]).find(function(x){return x.id===guestId;});
    if(!g) return;
    var qr=makeQRhd(tokenUrl(g.token));
    var blob=await qr.getRawData("png");
    if(!blob) return;
    var file=new File([blob],"VZOR-"+sc(code)+".png",{type:"image/png"});
    if(navigator.canShare && navigator.canShare({files:[file]})){
        navigator.share({files:[file],title:"VZOR QR",text:"VZOR access: "+code});
    } else {
        var url=URL.createObjectURL(blob);
        var a=document.createElement("a");
        a.href=url; a.download="VZOR-"+sc(code)+".png"; a.click();
        URL.revokeObjectURL(url);
        alert("QR saved. Attach it manually in "+platform);
    }
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
    setTimeout(function(){
        if(platform==="Telegram"){
            window.open("https://t.me/share/url?url="+encodeURIComponent(fullurl(code))+"&text="+encodeURIComponent("VZOR access: "+code+" (QR attached)"),"_blank");
        } else {
            window.open("https://wa.me/?text="+encodeURIComponent("VZOR access\\n\\nCode: "+code+"\\n"+fullurl(code)+"\\n\\n(QR attached)"),"_blank");
        }
    }, 500);
}"""

code = code.replace(old_fn, new_fn)
print("shareQRImage fixed: download + open app")

# Also fix shareResultQR the same way
old_result_fn = """async function shareResultQR(platform){
    if(!lastCreated) return;
    var qr=makeQRhd(tokenUrl(lastCreated.guest.token));
    var blob=await qr.getRawData("png");
    if(!blob) return;
    var file=new File([blob],"VZOR-"+sc(lastCreated.access_code)+".png",{type:"image/png"});
    if(navigator.canShare && navigator.canShare({files:[file]})){
        navigator.share({files:[file],title:"VZOR QR",text:"VZOR access: "+lastCreated.access_code});
    } else {
        var url=URL.createObjectURL(blob);
        var a=document.createElement("a");
        a.href=url; a.download="VZOR-"+sc(lastCreated.access_code)+".png"; a.click();
        URL.revokeObjectURL(url);
        alert("QR saved. Attach it manually in "+platform);
    }
}"""

new_result_fn = """async function shareResultQR(platform){
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
            window.open("https://wa.me/?text="+encodeURIComponent("VZOR access\\n\\nCode: "+code+"\\n"+fullurl(code)+"\\n\\n(QR attached)"),"_blank");
        }
    }, 500);
}"""

code = code.replace(old_result_fn, new_result_fn)
print("shareResultQR fixed: download + open app")

with open("/home/vzor/vzor/config/nginx/www/admin.html", "w") as f:
    f.write(code)

print("Done!")
