const MAX_TOKENS = 5; // Maximum number of tokens allowed
const REFILL_RATE = 1; // Tokens refilled per second

let objects = {}; // Object to hold token counts for each object

function getTokenCount(objectId) {
    if (!objects[objectId]) {
        const timestamp = Date.now();
        objects[objectId] = {tokens: MAX_TOKENS, lastRefill: timestamp}; // Initialize with max tokens
    }
    return objects[objectId].tokens;
}

function refillTokens(objectId) {
    const currentTime = Date.now();
    const obj = objects[objectId];
    
    if (!obj) return; // If object does not exist, do nothing

    const elapsedTime = (currentTime - obj.lastRefill) / 1000; // Convert milliseconds to seconds
    const tokensToAdd = Math.floor(elapsedTime * REFILL_RATE);
    
    if (tokensToAdd > 0){ // If no time has passed, do nothing
        obj.tokens = Math.min(MAX_TOKENS, obj.tokens + tokensToAdd); // Ensure tokens do not exceed max limit
        obj.lastRefill = currentTime; // Update last refill time
    }
}

export function ratelimiterchecker(req,res,next) {
    const ipAddress = req.ip; // Get the IP address of the request

    //get the token count for the IP address
    refillTokens(ipAddress);
    const tokenCount = getTokenCount(ipAddress);
    if(tokenCount >= 1){
        // If tokens are available, allow the request and decrement the token count
        objects[ipAddress].tokens -= 1;
        res.setHeader('X-RateLimit-Remaining', objects[ipAddress].tokens); // Set header for remaining tokens
        res.setHeader('X-RateLimit-Limit', MAX_TOKENS); // Set header for max tokens allowed
        res.setHeader('X-RateLimit-Reset', Math.ceil((MAX_TOKENS - objects[ipAddress].tokens) / REFILL_RATE)); // Set header for reset time
    }else{
        // If no tokens are available, send a 429 Too Many Requests response
        res.status(429).send('Too many requests, please try again later.');
        return;
    }

    next();
}