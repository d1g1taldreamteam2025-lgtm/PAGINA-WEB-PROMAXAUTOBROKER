/* =====================================================================
   META PIXEL (Facebook) — Promax Auto Broker
   ---------------------------------------------------------------------
   ID del pixel: 1709075950232187  (cuenta de Meta de Promax / UCallNow).
   Se carga en el <head> de TODAS las páginas PÚBLICAS (NO en /admin, para
   no ensuciar los datos con las visitas del panel). Registra "PageView" en
   cada carga de página. Los eventos se ven en Meta Events Manager, no en
   nuestro panel de Analytics (son sistemas distintos).
   Si algún día cambia el ID, se cambia AQUÍ (una sola vez) y en los <noscript>
   de cada página.
   ===================================================================== */
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','1709075950232187');
fbq('track','PageView');
