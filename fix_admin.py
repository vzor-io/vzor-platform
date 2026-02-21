import sys

with open("/home/vzor/vzor/config/nginx/www/admin.html", "r") as f:
    lines = f.readlines()

# Find the range to replace: line 289 "var html="";" to line 339 "innerHTML=html;"
start = None
end = None
for i, line in enumerate(lines):
    if '    var html="";' in line and start is None:
        start = i
    if 'document.getElementById("guest-list").innerHTML=html;' in line and start is not None:
        end = i
        break

if start is None or end is None:
    print(f"ERROR: Could not find block. start={start} end={end}")
    sys.exit(1)

print(f"Replacing lines {start+1}-{end+1}")

new_block = '''    var html="";
    for(var i=0;i<list.length;i++){
        var g=list[i];
        var now=new Date(), exp=new Date(g.expires_at), isExp=exp<now;
        var st=!g.is_active?"stopped":isExp?"expired":"active";

        html+='<div class="guest" id="g-'+g.id+'">'
            +'<div class="guest-row">'
            +'<div class="guest-main" onclick="toggle('+g.id+')">'
            +'<div class="guest-name"><span class="pill '+st+'">'+st+'</span>'+esc(g.name)+'</div>'
            +'<div class="guest-meta">'
            +'<span>'+fmtDate(g.expires_at)+'</span>'
            +'<span>Logins: '+(g.login_count||0)+'</span>'
            +'</div></div>'
            +'<div class="row-actions">';

        if(g.is_active){
            html+='<button class="dbtn stop" onclick="event.stopPropagation();stopG('+g.id+')">Stop</button>';
        } else {
            html+='<button class="dbtn start" onclick="event.stopPropagation();startG('+g.id+')">Start</button>';
        }
        html+='<button class="dbtn delete" onclick="event.stopPropagation();deleteG('+g.id+')">Delete</button>'
            +'</div></div>'
            +'<div class="guest-detail" id="det-'+g.id+'">'
            +'<div class="detail-qr" id="dqr-'+g.id+'"></div>'
            +'<div class="detail-right">'
            +'<div class="detail-row"><span class="detail-label">Name</span><input class="edit-input" id="en-'+g.id+'" value="'+esc(g.name)+'" onclick="event.stopPropagation()"></div>'
            +'<div class="detail-row"><span class="detail-label">Email</span><input class="edit-input" id="ee-'+g.id+'" value="'+esc(g.email||"")+'" placeholder="email" onclick="event.stopPropagation()"></div>'
            +'<div class="detail-row"><span class="detail-label">Code</span><span class="detail-value">'+g.access_code+'</span></div>'
            +'<div class="detail-row"><span class="detail-label">Link</span><span class="detail-value"><a href="'+fullurl(g.access_code)+'" target="_blank">'+surl(g.access_code)+'</a></span></div>'
            +'<div class="detail-actions">'
            +'<button class="dbtn save" id="sv-'+g.id+'" onclick="event.stopPropagation();saveGuest('+g.id+')">Save</button>'
            +'<button class="dbtn copy" id="cl-'+g.id+'" onclick="event.stopPropagation();copyCode('+g.id+',&#39;'+esc(g.access_code)+'&#39;)">Copy code</button>'
            +'<button class="dbtn download" onclick="event.stopPropagation();dlGuestQR('+g.id+',&#39;'+esc(g.access_code)+'&#39;)">QR</button>'
            +'<span style="display:inline-flex;align-items:center;gap:4px">'
            +'<input type="number" id="ext-'+g.id+'" value="30" min="1" max="999" onclick="event.stopPropagation()" style="width:52px;padding:4px 6px;font-size:11px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);outline:none;text-align:center;font-family:inherit">'
            +'<button class="dbtn extend" onclick="event.stopPropagation();extendG('+g.id+')">+ days</button>'
            +'</span>'
            +'<button class="dbtn wa" onclick="event.stopPropagation();shareAll('+g.id+',&#39;'+esc(g.access_code)+'&#39;,&#39;whatsapp&#39;)">WhatsApp</button>'
            +'<button class="dbtn tg" onclick="event.stopPropagation();shareAll('+g.id+',&#39;'+esc(g.access_code)+'&#39;,&#39;telegram&#39;)">Telegram</button>'
            +'</div></div></div></div>';
    }
    document.getElementById("guest-list").innerHTML=html;
'''

lines[start:end+1] = [new_block]

with open("/home/vzor/vzor/config/nginx/www/admin.html", "w") as f:
    f.writelines(lines)

print("OK - render block replaced")
