/**
 * 表单提交：优先走后端 /api/contact；失败则退回邮件方式，保证不会“点了没反应”。
 */
(function () {
  var MAIL = 'yiyatech@bj-ip.com';
  var PHONE = '185 1050 1896';

  document.querySelectorAll('form.lead-form').forEach(function (form) {
    var msg = form.querySelector('.form-msg');
    var btn = form.querySelector('button[type="submit"]');

    function setMsg(text, type) {
      if (!msg) return;
      msg.className = 'form-msg' + (type ? ' ' + type : '');
      msg.innerHTML = text;
    }

    function mailtoFallback(data) {
      var subject = '官网表单：' + (data.name || '新咨询');
      var body = [
        '称呼：' + (data.name || ''),
        '手机：' + (data.phone || ''),
        '邮箱：' + (data.email || ''),
        '想聊：' + (data.topic || ''),
        '来源：' + (data.source || ''),
        '',
        data.message || ''
      ].join('\n');
      return 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var fd = new FormData(form);
      var data = {};
      fd.forEach(function (v, k) { data[k] = String(v).trim(); });

      if (data._gotcha) return;                       // 蜜罐命中，静默忽略
      if (!data.name || !data.phone) {
        setMsg('请先填写称呼和手机号。', 'err');
        return;
      }
      if (data.phone.replace(/\D/g, '').length < 7) {
        setMsg('手机号看起来不太对，麻烦再检查一下。', 'err');
        return;
      }

      btn.disabled = true;
      var original = btn.textContent;
      btn.textContent = '发送中…';
      setMsg('');

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function () {
          form.reset();
          setMsg('收到了，我们通常在一个工作日内回复你。急事可以直接打 ' + PHONE + '。', 'ok');
        })
        .catch(function () {
          setMsg(
            '暂时没能提交成功。可以直接打 <a href="tel:+8618510501896">' + PHONE + '</a>，' +
            '或 <a href="' + mailtoFallback(data) + '">用邮件发送同样内容</a>。',
            'err'
          );
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = original;
        });
    });
  });
})();
