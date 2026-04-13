import PDFDocument from 'pdfkit';
import Complaint from '../models/complaintModel.js';

export const generateComplaintPDF = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id).populate('citizen', 'name mobile');

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Only the citizen who made it, or an official, can download the PDF
        const isOfficial = ['admin', 'official_local', 'official_district', 'official_state'].includes(req.user.role);
        if (complaint.citizen._id.toString() !== req.user._id.toString() && !isOfficial) {
            return res.status(403).json({ message: 'Not authorized to download this receipt' });
        }

        // Initialize PDF Document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // Set response headers to force download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Grievance_Receipt_${complaint._id.toString().substring(0, 8).toUpperCase()}.pdf`);

        // Pipe directly to the HTTP response
        doc.pipe(res);

        // --- Document Styling (Mock Official Government Letterhead) ---

        // Header
        doc.fillColor('#ea580c').fontSize(24).font('Helvetica-Bold').text('Bharat JanSetu', { align: 'center' });
        doc.fillColor('#64748b').fontSize(10).font('Helvetica').text('National Governance Bridge - Official Grievance Portal', { align: 'center' });
        doc.moveDown(2);

        // Title
        doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('Grievance Acknowledgement Receipt', { align: 'center', underline: true });
        doc.moveDown(2);

        // Meta Data Box
        const startX = 50;
        let startY = doc.y;

        doc.rect(startX, startY, 495, 120).stroke('#cbd5e1'); // Box border

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#334155');
        doc.text('Grievance ID:', startX + 15, startY + 15);
        doc.text('Date Submitted:', startX + 15, startY + 35);
        doc.text('Category / Dept:', startX + 15, startY + 55);
        doc.text('Priority Level:', startX + 15, startY + 75);
        doc.text('Current Status:', startX + 15, startY + 95);

        doc.font('Helvetica').fillColor('#0f172a');
        doc.text(complaint._id.toString(), startX + 120, startY + 15);
        doc.text(new Date(complaint.createdAt).toLocaleString('en-IN'), startX + 120, startY + 35);
        doc.text(`${complaint.category} (${complaint.department || 'N/A'})`, startX + 120, startY + 55);

        // Priority Color Logic
        let prioColor = '#0f172a';
        if (complaint.priority === 'High' || complaint.priority === 'Critical') prioColor = '#dc2626';
        if (complaint.priority === 'Medium') prioColor = '#ea580c';
        doc.fillColor(prioColor).text(complaint.priority, startX + 120, startY + 75).fillColor('#0f172a');

        doc.text(complaint.status, startX + 120, startY + 95);

        doc.moveDown(3);

        // Citizen Details
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text('Citizen Information');
        doc.moveTo(startX, doc.y).lineTo(545, doc.y).stroke('#cbd5e1'); // underline line
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Name: ${complaint.citizen.name}`);
        doc.text(`Mobile: ${complaint.citizen.mobile}`);
        doc.moveDown(2);

        // Complaint Details
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text('Complaint Description');
        doc.moveTo(startX, doc.y).lineTo(545, doc.y).stroke('#cbd5e1'); // underline line
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').text(`Title: ${complaint.title}`);
        doc.moveDown(0.5);
        doc.font('Helvetica').text(complaint.description, { width: 495, align: 'justify' });
        doc.moveDown(2);

        // Location Info
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text('Location of Issue');
        doc.moveTo(startX, doc.y).lineTo(545, doc.y).stroke('#cbd5e1'); // underline line
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`District: ${complaint.district}`);
        doc.text(`Block: ${complaint.block}`);
        if (complaint.village) doc.text(`Village: ${complaint.village}`);
        if (complaint.location && complaint.location.addressLine) {
            doc.text(`Address: ${complaint.location.addressLine}, Pincode: ${complaint.location.pincode}`);
        }

        doc.moveDown(4);

        // Footer & Digital Signature
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8');
        doc.text('This is a computer-generated document. No signature is required.', { align: 'center' });
        doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });

        // Finalize PDF file
        doc.end();

    } catch (error) {
        console.error('PDF Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to generate PDF receipt', error: error.message });
        }
    }
};
