/**
 * app.js
 *
 * Bootstraps the application, handles global events like tab switching.
 */
document.addEventListener('DOMContentLoaded', () => {

  // Initialize Tabs Logic
  Tab1.init();
  Tab2.init();

  // Handle Tab Switching
  const tabBtns = document.querySelectorAll('.tab');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => p.classList.remove('active'));

      // Add active to clicked
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      
      const tabId = btn.getAttribute('data-tab');
      const panel = document.getElementById(`tab-panel-${tabId}`);
      if (panel) {
        panel.classList.add('active');
      }
    });
  });

});
