const chatBot = require('../chat_bot');


describe('Chat bot logic', () => {
  it('Evaluate message and should not kick user', async () => {
    const scoreMock = {
      'FLIRTATION': false,
      'TOXICITY': false,
      'INSULT': false,
      'INCOHERENT': false,
      'SPAM': false,
    };

    const evaluatorApiMock = {
      analyzeText: (message) => scoreMock,
    };
    const messageMock = {
      content: 'some message',
      author: {id: 1},
      react: (emoji) => {},
    };

    const analyzerSpy =
      spyOn(evaluatorApiMock, 'analyzeText').and.callThrough();
    const messageReactSpy = spyOn(messageMock, 'react').and.callThrough();

    const result = await chatBot.methods.evaluateMessage(
        evaluatorApiMock,
        messageMock,
    );

    expect(result).toBe(false);
    expect(analyzerSpy).toHaveBeenCalledWith('some message');
    expect(analyzerSpy.calls.count()).toEqual(1);
    expect(messageReactSpy).not.toHaveBeenCalled();
  });
});
