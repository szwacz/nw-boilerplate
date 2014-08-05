import helloWorld from 'helpers/hello_world';

describe("hello world", function () {
    
    it("greets", function () {
        expect(helloWorld.greet()).toBe('Hello World!');
    });
    
});