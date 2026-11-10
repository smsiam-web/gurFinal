import React from 'react';
import jsPDF from 'jspdf';

const MyComponent = () => {

  const generateAndPrintPDF = () => {
    const doc = new jsPDF();

    // Add content to the PDF
    doc.text(20, 20, 'Hello, this is an example PDF.');

    // Print the PDF
    // Note: Browser settings determine the printer and printing behavior
    doc.autoPrint();

    // Save the PDF and trigger the print
    const blob = doc.output('blob');
    const data = window.URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = data;
    document.body.appendChild(iframe);
    iframe.contentWindow.print();
  };

  return (
    <div>
      <button onClick={generateAndPrintPDF}>Generate and Print PDF</button>
    </div>
  );
};

export default MyComponent;
