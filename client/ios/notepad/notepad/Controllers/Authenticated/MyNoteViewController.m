#import "MyNoteViewController.h"
#import "Globals.h"

@import PromiseKit;

@interface MyNoteViewController ()
@property UIActivityIndicatorView* activityIndicator;

@property(weak, nonatomic) IBOutlet UITextView* secretNotesField;
@property(weak, nonatomic) IBOutlet UITextField* shareWithField;
@property(weak, nonatomic) IBOutlet UILabel* errorLabel;

@end

@implementation MyNoteViewController

- (void)viewDidLoad
{
  self.navbarTitle = @"My note";

  [super viewDidLoad];
  
  self.secretNotesField.textContainer.maximumNumberOfLines = 15;

  _activityIndicator = [[UIActivityIndicatorView alloc]
      initWithFrame:CGRectMake(self.view.bounds.size.width / 2 - 25, self.view.bounds.size.height / 2 - 25, 50, 50)];
  [_activityIndicator setActivityIndicatorViewStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [_activityIndicator setColor:[UIColor blueColor]];
  [self.view addSubview:_activityIndicator];
  [_activityIndicator startAnimating];
  [[Globals sharedInstance] getData]
      .then(^(NSString* b64EncryptedData) {
        NSData* encryptedData = [[NSData alloc] initWithBase64EncodedString:b64EncryptedData options:0];
        return [[Globals sharedInstance].tanker decryptStringFromData:encryptedData];
      })
      .then(^(NSString* clearText) {
        self.secretNotesField.text = clearText;
        [self.activityIndicator stopAnimating];
      })
      .catch(^(NSError* error) {
        [self.activityIndicator stopAnimating];
        // TODO constant
        if ([error.domain isEqualToString:@"io.notepad"] && error.code == 404)
          self.secretNotesField.text = @"";
      });
}

- (void)didReceiveMemoryWarning
{
  [super didReceiveMemoryWarning];
  // Dispose of any resources that can be recreated.
}

- (PMKPromise<NSString*>*)getUserIdFromEmail:(NSString*)email
{
  if (email.length != 0)
  {
    return [[Globals sharedInstance] getUsers]
    .then(^(NSArray<id>* users) {
      NSPredicate *predicate = [NSPredicate predicateWithFormat:@"email==%@", email];
      NSArray *results = [users filteredArrayUsingPredicate:predicate];

      if ([results count] == 1) {
        NSString* userId = [results[0] objectForKey:@"id"];
        return userId;
      }

      return @"";
    });
  } else {
    return [PMKPromise promiseWithValue:@""];
  }
}

- (PMKPromise<TKREncryptionOptions*>*)buildEncryptOptions:(NSString*)recipientUserEmail
{
  TKREncryptionOptions* opts = [TKREncryptionOptions defaultOptions];

  if (recipientUserEmail.length != 0)
  {
    return [self getUserIdFromEmail:recipientUserEmail]
    .then(^(NSString* recipientUserId) {
      if (recipientUserId.length != 0) {
        opts.shareWith = @[ recipientUserId ];
      }
      return opts;
    });
  } else {
    return [PMKPromise promiseWithValue:opts];
  }
}

- (IBAction)saveNotes:(UIButton*)sender
{
  [_activityIndicator startAnimating];

  NSString* recipientUserEmail =
      [_shareWithField.text stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];

  NSString* text = self.secretNotesField.text;

  __block TKREncryptionOptions *encryptionOptions;
  __block Globals *inst = [Globals sharedInstance];

  [self buildEncryptOptions:recipientUserEmail]
    .then(^(TKREncryptionOptions* opts) {
      encryptionOptions = opts;
      return [inst.tanker encryptDataFromString:text options:opts];

    }).then(^(NSData* encryptedData) {
      NSString* b64EncryptedData = [encryptedData base64EncodedStringWithOptions:0];
      return [inst putData:b64EncryptedData];

    }).then(^{
      NSLog(@"Data sent to server");

      if (!encryptionOptions.shareWith || encryptionOptions.shareWith.count == 0) {
        return [inst shareTo:@[]]; // "unshare" previous share if any
      }

      NSString* recipientUserId = encryptionOptions.shareWith[0];
      NSLog(@"Sharing data with %@", recipientUserId);
      return [inst shareTo:@[ recipientUserId ]];

    }).then(^{
      [self.activityIndicator stopAnimating];

    })
    .catch(^(NSError* error) {
      [self.activityIndicator stopAnimating];
      NSLog(@"Could not encrypt and send data to server: %@", [error localizedDescription]);
    });
}

@end
