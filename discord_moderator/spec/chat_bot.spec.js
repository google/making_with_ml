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
      author: {id: '1'},
      react: (emoji) => {},
    };

    const analyzerSpy =
      spyOn(evaluatorApiMock, 'analyzeText').and.callThrough();
    const messageReactSpy = spyOn(messageMock, 'react').and.callThrough();

    const result = await chatBot.methods.evaluateMessage(
        evaluatorApiMock,
        messageMock,
        {'1': []},
    );

    expect(result).toBe(false);
    expect(analyzerSpy).toHaveBeenCalledWith('some message');
    expect(analyzerSpy.calls.count()).toEqual(1);
    expect(messageReactSpy).not.toHaveBeenCalled();
  });

  it('Evaluate message and should kick user after toxic msgs', async () => {
    const scoreMock = {
      'FLIRTATION': false,
      'TOXICITY': true,
      'INSULT': false,
      'INCOHERENT': false,
      'SPAM': false,
    };

    const users = {'1': []};

    const evaluatorApiMock = {
      analyzeText: (message) => scoreMock,
    };
    const messageMock = {
      content: 'some message',
      author: {id: '1'},
      react: (emoji) => {},
    };

    const analyzerSpy =
      spyOn(evaluatorApiMock, 'analyzeText').and.callThrough();
    const messageReactSpy = spyOn(messageMock, 'react').and.callThrough();

    const result = await chatBot.methods.evaluateMessage(
        evaluatorApiMock,
        messageMock,
        users,
    );

    expect(result).toBe(false);

    let finalResult;
    for (let i = 0; i < 4; i++) {
      finalResult = await chatBot.methods.evaluateMessage(
          evaluatorApiMock,
          messageMock,
          users,
      );
    }

    expect(finalResult).toBe(true);

    expect(analyzerSpy).toHaveBeenCalledWith('some message');
    expect(analyzerSpy.calls.count()).toEqual(5);
    expect(messageReactSpy.calls.count()).toEqual(5);
  });
});
