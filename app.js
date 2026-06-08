document.addEventListener('DOMContentLoaded', function() {
    console.log("[Diagnostics] Blueprint Enterprise Engine Loaded (Offline/Stable).");
    const { jsPDF } = window.jspdf;

    // --- 0. HIDE SPLASH SCREEN ---
    setTimeout(() => { 
        const splash = document.getElementById('splashScreen'); 
        if(splash) { 
            splash.style.opacity = '0'; 
            setTimeout(() => splash.style.display = 'none', 600); 
        } 
    }, 1500);

    // --- 1. DYNAMIC HEADER ---
    window.brandLogos = {
        "Clearview": "clearview.png",
        "CO Home Improvements": "co-home-improvements.png",
        "Orion Windows": "orion.png",
        "Planet": "planet.png",
        "Trent Valley Windows": "trent-valley.png",
        "West Yorkshire Windows": "west-yorkshire.png",
        "Yorkshire Windows": "yorkshire.png"
    };

    const brandSelect = document.getElementById('brandSelect');
    const brandLogo = document.getElementById('dynamicBrandLogo');
    const brandName = document.getElementById('dynamicBrandName');
    const brandDisplay = document.getElementById('brandDisplay');

    function updateBrandHeader() {
        if (!brandSelect || !brandLogo || !brandName) return;
        const brand = brandSelect.value;
        if (brand && window.brandLogos[brand]) {
            brandLogo.src = window.brandLogos[brand];
            brandLogo.style.display = 'block';
            brandName.innerText = brand;
            brandDisplay.classList.add('has-logo');
        } else {
            brandLogo.style.display = 'none';
            brandName.innerText = "Survey Pro";
            brandDisplay.classList.remove('has-logo');
        }
    }

    if (brandSelect) brandSelect.addEventListener('change', updateBrandHeader);

    // --- 2. PROFILE MANAGER ---
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
        if (!name) return alert("Enter designer name");
        window.designerProfiles[name] = { email: document.getElementById('profEmail').value, phone: document.getElementById('profPhone').value };
        localStorage.setItem('savedDesignerProfiles', JSON.stringify(window.designerProfiles));
        document.getElementById('designerSelect').value = name;
        refreshDropdown();
        document.getElementById('profileModal').style.display = 'none';
    });

    // --- 3. AUTOSAVE ---
    document.querySelectorAll('input:not([type="file"]), select, textarea').forEach(input => {
        const saved = JSON.parse(localStorage.getItem('surveyAppData')) || {};
        if (saved[input.id]) input.value = saved[input.id];
        input.addEventListener('input', () => {
            const data = JSON.parse(localStorage.getItem('surveyAppData')) || {};
            data[input.id] = input.value;
            localStorage.setItem('surveyAppData', JSON.stringify(data));
        });
    });

    document.getElementById('resetFormBtn')?.addEventListener('click', () => {
        if(confirm("Are you sure you want to clear the entire form for a new appointment?")) {
            localStorage.removeItem('surveyAppData');
            location.reload();
        }
    });

    updateBrandHeader(); 

    // --- 4. FABRIC CANVAS V2 ---
    window.appCanvases = {};
    document.querySelectorAll('.canvas-group').forEach(group => {
        const id = group.getAttribute('data-id');
        const canvasEl = group.querySelector('canvas');
        if (!canvasEl) return;

        const fCanvas = new fabric.Canvas(canvasEl.id, { 
            isDrawingMode: false, allowTouchScrolling: true, selection: false
        });
        fCanvas.freeDrawingBrush.color = '#00E5FF';
        fCanvas.freeDrawingBrush.width = 4;
        window.appCanvases[id] = fCanvas;

        const savedData = JSON.parse(localStorage.getItem('surveyAppData')) || {}; 
        if(savedData['canvas_' + id]) fCanvas.loadFromJSON(savedData['canvas_' + id], fCanvas.renderAll.bind(fCanvas));
        
        const saveCanvasState = () => { 
            const data = JSON.parse(localStorage.getItem('surveyAppData')) || {}; 
            data['canvas_' + id] = JSON.stringify(fCanvas.toJSON()); 
            localStorage.setItem('surveyAppData', JSON.stringify(data)); 
        }; 
        fCanvas.on('object:added', saveCanvasState); 
        fCanvas.on('object:modified', saveCanvasState); 

        const fileInput = group.querySelector('.camera-input');
        if(fileInput) {
            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function(f) {
                    fabric.Image.fromURL(f.target.result, function(img) {
                        fCanvas.clear();
                        const scale = Math.min(fCanvas.width / img.width, fCanvas.height / img.height);
                        img.set({ scaleX: scale, scaleY: scale, originX: 'center', originY: 'center', left: fCanvas.width/2, top: fCanvas.height/2, selectable: false });
                        fCanvas.add(img); fCanvas.sendToBack(img); saveCanvasState();
                    });
                };
                reader.readAsDataURL(file);
            });
        }
    });

    // --- 5. BULLETPROOF PDF GENERATION ---
    document.getElementById('generateCustomerPdfBtn')?.addEventListener('click', async () => {
        const nameInput = document.getElementById('clientName');
        // Fallback name if left blank so it doesn't crash
        const rawName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Valued Customer';
        const surname = rawName.split(' ').pop() || 'Customer';
        
        const template = document.getElementById('pdfTemplateCustomer');
        if(!template) return alert("Error: Template missing");

        // Populate fields
        const size = document.getElementById('proposedSize')?.value || "TBC";
        const roof = document.getElementById('roofType')?.value || "TBC";
        const frame = document.getElementById('frameColour')?.value || "TBC";
        const bRegs = document.getElementById('buildingRegs')?.value || "No";
        const pPerms = document.getElementById('planningPerms')?.value || "No";
        const designerName = document.getElementById('designerSelect')?.value || "Your Designer";
        
        document.getElementById('lp-greeting').innerText = `Dear ${rawName}, thank you for your time today to discuss your exciting new project.`;
        document.getElementById('lp-size').innerText = `Based on our measurements, we are looking at a proposed size of approximately ${size}.`;
        document.getElementById('lp-roof').innerText = `We discussed utilizing the ${roof} system to ensure the space is perfect year-round.`;
        document.getElementById('lp-frame').innerText = `For the aesthetics, we have noted your preference for ${frame} frames.`;
        
        let compText = "";
        if(bRegs === "Yes" || pPerms !== "No") {
            compText = `Your project will require some compliance oversight (Building Regs: ${bRegs}, Planning: ${pPerms}). Our team handles all of this for you.`;
        } else {
            compText = "Your project currently looks to be exempt from additional planning compliance, streamlining our timeline.";
        }
        document.getElementById('lp-compliance').innerText = compText;
        
        const rDate = document.getElementById('revisitDate')?.value;
        if(rDate) {
            document.getElementById('lp-revisit').innerText = `I look forward to our next catch-up scheduled for ${rDate}. We will go through your custom 3D designs then.`;
        } else {
            document.getElementById('lp-revisit').innerText = `We haven't booked in a date for our next catch-up just yet, but I will be in touch shortly to get you scheduled in.`;
        }

        document.getElementById('lp-designer-name').innerText = designerName;

        // Briefly bring template fully into frame (behind everything) so html2canvas doesn't crash
        template.style.left = '0px'; 
        template.style.zIndex = '-9999';

        try {
            const canvas = await html2canvas(template, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${surname}_Design_Consultation.pdf`);
        } catch(e) {
            console.error(e);
            alert("PDF Generation failed. Please try again.");
        } finally {
            // Send it back off-screen
            template.style.left = '-9999px';
        }
    });
});
