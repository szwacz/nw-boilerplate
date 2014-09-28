import { greet } from './hello_world';

describe("hello world", function () {
    
    it("greets", function () {
        expect(greet()).toBe('Hello World!');
    });
    
});