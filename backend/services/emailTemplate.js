function birthdayTemplate(employeeName, message, companyName = "SmartHR") {
    const safeMessage = String(message).replace(/\{employeeName\}/g, employeeName);
    return `
    <div style="margin:0;background:#f4f6fb;padding:32px;font-family:Arial,sans-serif;color:#26324a">
      <div style="max-width:600px;margin:auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #edf0f5">
        <div style="background:#313b66;padding:28px;text-align:center;color:white">
          <div style="font-size:28px;font-weight:bold">S</div><div style="font-size:20px;font-weight:bold">${companyName}</div>
        </div>
        <div style="padding:36px;text-align:center">
          <div style="font-size:42px;margin-bottom:12px">🎉</div>
          <h1 style="color:#5365d8;margin:0 0 14px">Happy Birthday, ${employeeName}!</h1>
          <p style="font-size:16px;line-height:1.7;color:#5f6b7a">${safeMessage}</p>
          <p style="margin-top:28px;color:#26324a"><strong>Best Wishes,<br/>HR Team<br/>${companyName}</strong></p>
        </div>
      </div>
    </div>`;
}

function workAnniversaryTemplate(employeeName, completedYears, companyName = "SmartHR") {
    return `
    <div style="margin:0;background:#f4f6fb;padding:32px;font-family:Arial,sans-serif;color:#26324a">
      <div style="max-width:600px;margin:auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #edf0f5">
        <div style="background:#313b66;padding:28px;text-align:center;color:white">
          <div style="font-size:28px;font-weight:bold">S</div><div style="font-size:20px;font-weight:bold">${companyName}</div>
        </div>
        <div style="padding:36px;text-align:center">
          <div style="font-size:42px;margin-bottom:12px">🏆</div>
          <h1 style="color:#5365d8;margin:0 0 14px">Happy ${completedYears}-Year Work Anniversary!</h1>
          <p style="font-size:16px;line-height:1.7;color:#5f6b7a">Dear ${employeeName}, congratulations on completing ${completedYears} wonderful year${completedYears === 1 ? "" : "s"} with ${companyName}. Thank you for your dedication and valuable contribution.</p>
          <p style="margin-top:28px;color:#26324a"><strong>Best Wishes,<br/>HR Team<br/>${companyName}</strong></p>
        </div>
      </div>
    </div>`;
}

module.exports = { birthdayTemplate, workAnniversaryTemplate };
