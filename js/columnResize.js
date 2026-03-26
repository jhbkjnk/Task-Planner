// js/columnResize.js
const ColumnResize = {
  init() {
    const table = document.getElementById('tasksTable');
    if (!table) return;

    const headers = table.querySelectorAll('thead th');
    headers.forEach((th, index) => {
      // Skip the checkbox column (index 0)
      if (index === 0) return;

      th.style.position = 'relative';
      const resizer = document.createElement('span');
      resizer.className = 'col-resizer';
      th.appendChild(resizer);

      let startX = 0;
      let startWidth = 0;

      // Mouse down event for initiating resize
      const onMouseDown = (e) => {
        startX = e.pageX;
        startWidth = th.offsetWidth;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
      };

      // Mouse move event to adjust column width
      const onMouseMove = (e) => {
        const dx = e.pageX - startX;
        const newWidth = Math.max(60, startWidth + dx); // Minimum width of 60px
        th.style.width = newWidth + 'px';
      };

      // Mouse up event to stop resizing
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      resizer.addEventListener('mousedown', onMouseDown);
    });
  }
};

// Initialize column resizing on page load
ColumnResize.init();
