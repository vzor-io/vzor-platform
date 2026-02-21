(function(){
  function loadBalances(){
    var x = new XMLHttpRequest();
    x.open('GET', '/api/balances', true);
    x.onload = function(){
      try {
        var b = JSON.parse(x.responseText).balances;
        var C = '#0ff';
        var R = '#f44';

        // Direct models
        var items = document.querySelectorAll('.model-item');
        items.forEach(function(el){
          var id = el.getAttribute('data-id');
          var tag = el.querySelector('.mi-tag');
          if (!tag || !id) return;
          if (id === 'deepseek' && b.deepseek) {
            tag.textContent = '$' + b.deepseek.balance;
            tag.style.color = b.deepseek.balance > 0 ? C : R;
          }
          if (id === 'claude' && b.anthropic) {
            var a = b.anthropic.balance;
            tag.textContent = a > 0 ? '$' + a : '/usr/bin/bash';
            tag.style.color = a > 0 ? C : R;
          }
          if (id === 'gemini') {
            tag.textContent = 'free';
            tag.style.color = C;
          }
        });

        // Tab labels
        var tabs = document.querySelectorAll('.model-tab');
        tabs.forEach(function(t){
          var tab = t.getAttribute('data-tab');
          if (tab === 'openrouter' && b.openrouter) {
            t.textContent = 'OpenRouter ($' + b.openrouter.balance + ')';
            t.style.color = C;
          }
          if (tab === 'direct' && b.deepseek) {
            t.textContent = 'Direct (DS:$' + b.deepseek.balance + ')';
          }
        });

      } catch(e){}
    };
    x.send();
  }

  setTimeout(loadBalances, 1000);
  setInterval(loadBalances, 60000);
})();
