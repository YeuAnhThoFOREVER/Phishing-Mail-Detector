var SCRIPT_PROPS = PropertiesService.getScriptProperties();

function onGmailMessage(e) {
  var accessToken = e.gmail.accessToken;
  var messageId = e.gmail.messageId;
  GmailApp.setCurrentMessageAccessToken(accessToken);
  var message = GmailApp.getMessageById(messageId);
  return buildHomeCard(message.getSubject() || "(No Subject)", message.getFrom(), messageId);
}

function buildHomeCard(subject, sender, messageId) {
  var card = CardService.newCardBuilder();
  var apiKey = SCRIPT_PROPS.getProperty('GEMINI_API_KEY');
  
  card.setHeader(CardService.newCardHeader().setTitle("🛡️ PhishGuard AI (Gemini 2.5 Free)"));
  var section = CardService.newCardSection().setHeader("📧 이메일 정보");

  if (!apiKey) {
    section.addWidget(CardService.newTextParagraph().setText("❌ **설정 필요:** Script Properties에 'GEMINI_API_KEY'를 추가하세요."));
    return [card.addSection(section).build()];
  }

  section.addWidget(CardService.newDecoratedText().setTopLabel("발신자").setText(sender).setWrapText(true));
  section.addWidget(CardService.newTextButton().setText("AI 피싱 분석 시작").setBackgroundColor("#1a73e8").setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(CardService.newAction().setFunctionName("analyzeEmail").setParameters({ messageId: messageId })));
  return [card.addSection(section).build()];
}

function analyzeEmail(e) {
  var accessToken = e.gmail.accessToken;
  GmailApp.setCurrentMessageAccessToken(accessToken);
  var messageId = e.parameters.messageId;
  
  try {
    var message = GmailApp.getMessageById(messageId);
    var body = (message.getPlainBody() || "").slice(0, 4000);
    var result = callGeminiAPI(message.getSubject(), message.getFrom(), body);

    if (typeof result === "string") return showError(result);
    return buildResultCard(result);
  } catch (err) {
    return showError("접근 권한 에러: Gmail을 새로고침 해주세요.");
  }
}

function callGeminiAPI(subject, sender, body) {
  var apiKey = SCRIPT_PROPS.getProperty('GEMINI_API_KEY');
  // UPDATED: Using Gemini 2.5 Flash and stable v1 endpoint
  var url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + apiKey;

  var prompt = "Analyze this email for phishing. Respond ONLY with a valid JSON object. " +
               "Format: {\"verdict\":\"SAFE\"|\"SUSPICIOUS\"|\"DANGER\", \"score\":0-100, \"summary\":\"Korean sentence\", \"recommendation\":\"Korean advice\"}\n\n" +
               "Sender: " + sender + "\nSubject: " + subject + "\nBody: " + body;

  var payload = {
    "contents": [{ "parts": [{ "text": prompt }] }],
    "safetySettings": [
      { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
      { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
      { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
      { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }
    ]
  };

  try {
    var response = UrlFetchApp.fetch(url, {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var resText = response.getContentText();
    var resJson = JSON.parse(resText);

    if (response.getResponseCode() !== 200) {
      return "🚨 API Error: " + (resJson.error ? resJson.error.message : resText);
    }

    var aiText = resJson.candidates[0].content.parts[0].text;
    var jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return "AI가 올바른 형식을 응답하지 않았습니다.";
    
    return JSON.parse(jsonMatch[0]);
  } catch (err) { 
    return "🚨 시스템 오류: " + err.toString(); 
  }
}

function buildResultCard(res) {
  var icon = res.verdict === "SAFE" ? "✅" : res.verdict === "SUSPICIOUS" ? "⚠️" : "🚨";
  var card = CardService.newCardBuilder().setHeader(CardService.newCardHeader().setTitle(icon + " 분석 완료: " + res.verdict))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newDecoratedText().setTopLabel("위험도 점수").setText(res.score + " / 100"))
      .addWidget(CardService.newTextParagraph().setText("**요약:** " + res.summary))
      .addWidget(CardService.newTextParagraph().setText("**권고:** " + res.recommendation))
      .addWidget(CardService.newTextButton().setText("← 돌아가기").setOnClickAction(CardService.newAction().setFunctionName("goBack"))));
  return CardService.newActionResponseBuilder().setNavigation(CardService.newNavigation().pushCard(card.build())).build();
}

function showError(msg) {
  var card = CardService.newCardBuilder().setHeader(CardService.newCardHeader().setTitle("⚠ 문제 발생"))
    .addSection(CardService.newCardSection().addWidget(CardService.newTextParagraph().setText(msg))).build();
  return CardService.newActionResponseBuilder().setNavigation(CardService.newNavigation().pushCard(card)).build();
}

function goBack() { return CardService.newActionResponseBuilder().setNavigation(CardService.newNavigation().popCard()).build(); }
