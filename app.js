document.addEventListener('DOMContentLoaded', function() {
    console.log("[Blueprint Enterprise] Engine Initialized (Restored Stable PDF/UI Logic)");
    const { jsPDF } = window.jspdf;

    // --- 1. Profile Manager (Restored) ---
    window.designerProfiles = JSON.parse(localStorage.getItem('savedDesignerProfiles')) || {};
    const refreshDropdown = () => {
        const list = document.getElementById('designerList');
        if (list) list.innerHTML = Object.keys(window.designerProfiles).map(n => `<option value="${n}">`).join('');
    };
    refreshDropdown();

    document.getElementById('openProfileManagerBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        const cur = document.getElementById('designerSelect').value;
        if (window.designerProfiles[cur]) {
            document.getElementById('profName').value = cur;
            document.getElementById('profEmail').value = window.designerProfiles[cur].email;
            document.getElementById('profPhone').value = window.designerProfiles[cur].phone;
        }
        document.getElementById('profileModal').style.display = 'flex';
    });

    document.getElementById('closeProfileBtn')?.addEventListener('click', () => document.getElementById('profileModal').style.display = 'none');
    document.getElementById('saveProfileBtn')?.addEventListener('click', () => {
        const name = document.getElementById('profName').value.trim();
        if (!name) return alert("Enter name");
        window.designerProfiles[name] = { email: document.getElementById('profEmail').value, phone: document.getElementById('profPhone').value };
        localStorage.setItem('savedDesignerProfiles', JSON.stringify(window.designerProfiles));
        document.getElementById('designerSelect').value = name;
        refreshDropdown();
        document.getElementById('profileModal').style.display = 'none';
    });

    // --- 2. Canvas Engine (Stable) ---
    window.appCanvases = {};
    document.querySelectorAll('.canvas-group').forEach(group => {
        const id = group.getAttribute('data-id');
        const canvasEl = group.querySelector('canvas');
        if (!canvasEl) return;
        const fCanvas = new fabric.Canvas(canvasEl.id, { isDrawingMode: false, allowTouchScrolling: true });
        window.appCanvases[id] = fCanvas;
    });

    // --- 3. Stable PDF Generation (Memory-Safe) ---
    async function executeSecurePDFGeneration(templateId, fileName, data) {
        const template = document.getElementById(templateId);
        const mainApp = document.querySelector('main');
        
        // Brute-force memory optimization: Hide main UI
        mainApp.style.display = 'none';
        template.style.display = 'block';
        window.scrollTo(0, 0);

        try {
            await new Promise(r => setTimeout(r, 1000)); // Allow render to catch up
            const doc = new jsPDF('p', 'mm', 'a4');
            const margin = 10;
            const pdfPrintWidth = doc.internal.pageSize.getWidth() - (margin * 2);

            if (templateId === 'pdfTemplateInternal') {
                let pages = Array.from(template.querySelectorAll('.pdf-page'));
                for(let i = 0; i < pages.length; i++) {
                    const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, windowWidth: 800 });
                    const imgData = canvas.toDataURL('image/jpeg', 0.9);
                    if (i > 0) doc.addPage();
                    doc.addImage(imgData, 'JPEG', margin, margin, pdfPrintWidth, (canvas.height * pdfPrintWidth) / canvas.width);
                }
            } else {
                const canvas = await html2canvas(template.querySelector('.pdf-page'), { scale: 2, useCORS: true, windowWidth: 800 });
                doc.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', margin, margin, pdfPrintWidth, (canvas.height * pdfPrintWidth) / canvas.width);
            }
            doc.save(fileName);
        } catch (e) { alert("PDF Error: " + e.message); } 
        finally {
            template.style.display = 'none';
            mainApp.style.display = 'block';
        }
    }

    // --- Buttons ---
    document.getElementById('generateInternalPdfBtn')?.addEventListener('click', async function() {
        await executeSecurePDFGeneration('pdfTemplateInternal', 'Internal_Survey.pdf', {});
    });

    document.getElementById('generateCustomerPdfBtn')?.addEventListener('click', async function() {
        await executeSecurePDFGeneration('pdfTemplateCustomer', 'Proposal.pdf', {});
    });
});
