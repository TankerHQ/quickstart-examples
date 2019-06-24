#import "HttpClient.h"

@interface HttpClient ()

@property(readonly) NSString* root;
@property(readonly) NSURLSession* session;

@end

@implementation HttpClient

- (instancetype)initWithRoot:(NSString*)root
{
  self = [super init];

  if (self)
  {
    _root = root;

    // The sharedSession implements NSHTTPCookieStorage so sessionId cookie will be sent in each request
    // See: https://developer.apple.com/documentation/foundation/nsurlsession/1409000-sharedsession
    _session = [NSURLSession sharedSession];
  }

  return self;
}

- (PMKPromise*)requestWithMethod:(NSString*)method
                            path:(NSString*)path
                            body:(NSData* _Nullable)body
                     contentType:(NSString*)contentType
{

  NSString* url = [NSString stringWithFormat:@"%@%@", self.root, path];
  NSString* contentLength = [NSString stringWithFormat:@"%lu", body.length];

  NSMutableURLRequest* request = [[NSMutableURLRequest alloc] initWithURL:[NSURL URLWithString:url]];
  [request setValue:contentType forHTTPHeaderField:@"Content-Type"];
  [request setValue:contentLength forHTTPHeaderField:@"Content-Length"];
  [request setHTTPMethod:method];
  [request setHTTPBody:body];

  return [PMKPromise promiseWithResolver:^(PMKResolver resolve) {
    NSURLSessionDataTask* dataTask = [self.session
        dataTaskWithRequest:request
          completionHandler:^(NSData* _Nullable data, NSURLResponse* _Nullable response, NSError* _Nullable error) {
            if (error)
            {
              resolve(error);
              return;
            }

            NSHTTPURLResponse* httpResponse = (NSHTTPURLResponse*)response;

            if (httpResponse.statusCode == 200 || httpResponse.statusCode == 201)
            {
              resolve(data);
              return;
            }

            NSLog(@"Response status code: %zd", httpResponse.statusCode);
            NSError* httpError =
                [[NSError alloc] initWithDomain:@"io.tanker.notepad" code:(long)httpResponse.statusCode userInfo:nil];
            resolve(httpError);
          }];

    [dataTask resume];
  }];
}

- (PMKPromise*)getWithPath:(NSString*)path
{
  return [self requestWithMethod:@"GET" path:path body:nil contentType:@"plain/text"];
}

- (PMKPromise*)postWithPath:(NSString*)path body:(NSData*)body contentType:(NSString*)contentType
{
  return [self requestWithMethod:@"POST" path:path body:body contentType:contentType];
}

- (PMKPromise*)putWithPath:(NSString*)path body:(NSData*)body contentType:(NSString*)contentType
{
  return [self requestWithMethod:@"PUT" path:path body:body contentType:contentType];
}

@end
