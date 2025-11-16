import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

const isTruthy = (value) => value !== undefined && value !== null && value !== '';

const addHeading = (sections, text, level = HeadingLevel.HEADING2) => {
  sections.push(new Paragraph({ text, heading: level }));
};

const addLabelValue = (sections, label, value) => {
  if (!isTruthy(value)) {
    return;
  }

  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true }),
        new TextRun({ text: String(value) })
      ]
    })
  );
};

const addBulletList = (sections, items, indentLevel = 0) => {
  items
    .filter(isTruthy)
    .forEach((text) => {
      sections.push(
        new Paragraph({
          bullet: { level: indentLevel },
          children: [new TextRun({ text: String(text) })]
        })
      );
    });
};

export const generateMedicalRecordDocx = async (record) => {
  const visitDate = new Date(record.createdAt);
  const followUpDate = record.followUpDate ? new Date(record.followUpDate) : null;

  const sections = [];

  sections.push(
    new Paragraph({ text: 'Visit Summary', heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Date of Visit: ', bold: true }),
        new TextRun({ text: visitDate.toLocaleString() })
      ]
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Patient: ', bold: true }),
        new TextRun({ text: record.patient?.name || 'N/A' })
      ]
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Attending Doctor: ', bold: true }),
        new TextRun({
          text: record.doctor
            ? `${record.doctor.name}${
                record.doctor.specialization ? ` (${record.doctor.specialization})` : ''
              }`
            : 'N/A'
        })
      ]
    }),
    new Paragraph({ text: '' })
  );

  if (record.vitalSigns && Object.values(record.vitalSigns).some(isTruthy)) {
    addHeading(sections, 'Vital Signs');
    addLabelValue(sections, 'Blood Pressure', record.vitalSigns.bloodPressure);
    addLabelValue(
      sections,
      'Heart Rate',
      isTruthy(record.vitalSigns.heartRate) ? `${record.vitalSigns.heartRate} bpm` : null
    );
    addLabelValue(
      sections,
      'Temperature',
      isTruthy(record.vitalSigns.temperature) ? `${record.vitalSigns.temperature} °C` : null
    );
    addLabelValue(
      sections,
      'Weight',
      isTruthy(record.vitalSigns.weight) ? `${record.vitalSigns.weight} kg` : null
    );
    addLabelValue(
      sections,
      'Height',
      isTruthy(record.vitalSigns.height) ? `${record.vitalSigns.height} cm` : null
    );
    sections.push(new Paragraph({ text: '' }));
  }

  addHeading(sections, 'Chief Complaint', HeadingLevel.HEADING2);
  sections.push(
    new Paragraph({ text: record.chiefComplaint || 'Not provided' }),
    new Paragraph({ text: '' })
  );

  if (record.historyOfPresentIllness) {
    addHeading(sections, 'History of Present Illness');
    sections.push(new Paragraph({ text: record.historyOfPresentIllness }), new Paragraph({ text: '' }));
  }

  if (record.examination) {
    addHeading(sections, 'Physical Examination');
    sections.push(new Paragraph({ text: record.examination }), new Paragraph({ text: '' }));
  }

  addHeading(sections, 'Diagnosis');
  sections.push(new Paragraph({ text: record.diagnosis || 'Not provided' }), new Paragraph({ text: '' }));

  if (record.treatmentPlan) {
    addHeading(sections, 'Treatment Plan');
    sections.push(new Paragraph({ text: record.treatmentPlan }), new Paragraph({ text: '' }));
  }

  if (Array.isArray(record.medications) && record.medications.length > 0) {
    addHeading(sections, 'Medications');
    record.medications
      .filter((med) => med?.name)
      .forEach((med) => {
        const details = [
          med.dosage ? `Dosage: ${med.dosage}` : null,
          med.frequency ? `Frequency: ${med.frequency}` : null,
          med.duration ? `Duration: ${med.duration}` : null
        ].filter(isTruthy);

        addBulletList(
          sections,
          [details.length > 0 ? `${med.name} (${details.join(' | ')})` : med.name]
        );

        if (med.instructions) {
          addBulletList(sections, [`Instructions: ${med.instructions}`], 1);
        }
      });
    sections.push(new Paragraph({ text: '' }));
  }

  if (Array.isArray(record.investigations) && record.investigations.length > 0) {
    addHeading(sections, 'Investigations');
    record.investigations
      .filter((test) => test?.testName)
      .forEach((test) => {
        const details = [
          test.date ? `Date: ${new Date(test.date).toLocaleDateString()}` : null,
          test.results ? `Results: ${test.results}` : null,
          test.notes ? `Notes: ${test.notes}` : null
        ].filter(isTruthy);

        addBulletList(
          sections,
          [details.length > 0 ? `${test.testName} (${details.join(' | ')})` : test.testName]
        );
      });
    sections.push(new Paragraph({ text: '' }));
  }

  if (record.followUpInstructions || (followUpDate && !Number.isNaN(followUpDate.valueOf()))) {
    addHeading(sections, 'Follow-up');

    if (followUpDate && !Number.isNaN(followUpDate.valueOf())) {
      addLabelValue(sections, 'Follow-up Date', followUpDate.toLocaleDateString());
    }

    if (record.followUpInstructions) {
      sections.push(new Paragraph({ text: record.followUpInstructions }));
    }
  }

  const document = new Document({
    creator: record.doctor?.name,
    title: `Visit Summary - ${visitDate.toLocaleDateString()}`,
    description: 'Generated visit summary from the appointment system',
    sections: [
      {
        properties: {},
        children: sections
      }
    ]
  });

  const buffer = await Packer.toBuffer(document);
  const filenameDatePart = visitDate.toISOString().split('T')[0];
  const safePatientName = (record.patient?.name || 'patient')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '') || 'patient';
  const filename = `visit-summary-${safePatientName}-${filenameDatePart}.docx`;

  return { buffer, filename };
};


