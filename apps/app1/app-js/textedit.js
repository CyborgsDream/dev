const id = WinAPI.createWindow('text-editor');

const win = document.getElementById(id);
const textarea = win?.querySelector('#text-editor-area');
const exportBtn = win?.querySelector('#text-editor-export');

function loadJsPDF(callback){
    if(window.jspdf){ callback(); return; }
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    script.onload=callback;
    document.head.appendChild(script);
}

if(exportBtn && textarea){
    exportBtn.addEventListener('click',()=>{
        loadJsPDF(()=>{
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const lines = doc.splitTextToSize(textarea.value,180);
            doc.text(lines,10,10);
            doc.save('document.pdf');
        });
    });
}
