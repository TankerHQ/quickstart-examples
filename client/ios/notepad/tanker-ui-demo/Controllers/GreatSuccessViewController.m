#import "GreatSuccessViewController.h"
#import "Globals.h"

@import PromiseKit;

@interface GreatSuccessViewController ()
@property UIActivityIndicatorView* activityIndicator;

@property(weak, nonatomic) IBOutlet UITextView* SecretNotesField;
@property(weak, nonatomic) IBOutlet UITextField* shareWithField;
@property(weak, nonatomic) IBOutlet UILabel* errorLabel;

@end

@implementation GreatSuccessViewController

- (void)viewDidLoad
{
  [super viewDidLoad];
  // Do any additional setup after loading the view.

  _activityIndicator = [[UIActivityIndicatorView alloc]
      initWithFrame:CGRectMake(self.view.bounds.size.width / 2 - 25, self.view.bounds.size.height / 2 - 25, 50, 50)];
  [_activityIndicator setActivityIndicatorViewStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [_activityIndicator setColor:[UIColor blueColor]];
  [self.view addSubview:_activityIndicator];
  [_activityIndicator startAnimating];
  [Globals dataFromServer]
      .then(^(NSString* b64EncryptedData) {
        NSData* encryptedData = [[NSData alloc] initWithBase64EncodedString:b64EncryptedData options:0];
        return [[Globals sharedInstance].tanker decryptStringFromData:encryptedData];
      })
      .then(^(NSString* clearText) {
        _SecretNotesField.text = clearText;
        [_activityIndicator stopAnimating];
      })
      .catch(^(NSError* error) {
        [_activityIndicator stopAnimating];
        // TODO constant
        if ([error.domain isEqualToString:@"io.tanker-ui-demo"] && error.code == 404)
          _SecretNotesField.text = @"";
      });
}

- (void)didReceiveMemoryWarning
{
  [super didReceiveMemoryWarning];
  // Dispose of any resources that can be recreated.
}

- (IBAction)saveNotes:(UIButton*)sender
{
  NSString* recipientUserId =
      [_shareWithField.text stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];

  [_activityIndicator startAnimating];
  NSString* text = _SecretNotesField.text;

  TKREncryptionOptions* opts = [TKREncryptionOptions defaultOptions];
  if (recipientUserId.length != 0)
    opts.shareWith = @[ recipientUserId ];
  [[Globals sharedInstance].tanker encryptDataFromString:text options:opts]
      .then(^(NSData* encryptedData) {
        NSString* b64EncryptedData = [encryptedData base64EncodedStringWithOptions:0];
        [Globals uploadToServer:b64EncryptedData].then(^{
          [_activityIndicator stopAnimating];
          NSLog(@"Data sent to server");
        });
      })
      .catch(^(NSError* error) {
        [_activityIndicator stopAnimating];
        NSLog(@"Could not encrypt and send data to server: %@", [error localizedDescription]);
      });
}

- (IBAction)shareWith:(UIButton*)sender
{
  NSString* recipientUserId = _shareWithField.text;

  if ([recipientUserId stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]].length == 0)
  {
    _errorLabel.text = @"Recipient is empty or filled with blanks";
    return;
  }
  [_activityIndicator startAnimating];

  [Globals dataFromServer]
      .then(^(NSString* b64EncryptedData) {
        NSData* encryptedData = [[NSData alloc] initWithBase64EncodedString:b64EncryptedData options:0];
        NSError* err = nil;
        NSString* resourceId = [[Globals sharedInstance].tanker resourceIDOfEncryptedData:encryptedData error:&err];
        if (err)
          return [PMKPromise promiseWithValue:err];
        return [[Globals sharedInstance].tanker shareResourceIDs:@[ resourceId ] toUserIDs:@[ recipientUserId ]].then(^{
          return [Globals shareNoteWith:@[ recipientUserId ]];
        });
      })
      .then(^{
        [_activityIndicator stopAnimating];
        NSLog(@"Data shared with user: %@", recipientUserId);
      })
      .catch(^(NSError* error) {
        [_activityIndicator stopAnimating];
        NSLog(@"Could not encrypt & share and send data to server: %@", [error localizedDescription]);
      });
}

- (IBAction)loadFrom:(UIButton*)sender
{
  NSString* senderUserId = _shareWithField.text;

  if ([senderUserId stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]].length == 0)
  {
    _errorLabel.text = @"Sender is empty or filled with blanks";
    return;
  }
  [_activityIndicator startAnimating];

  [Globals getDataFromUser:senderUserId]
      .then(^(NSString* b64EncryptedData) {
        NSData* encryptedData = [[NSData alloc] initWithBase64EncodedString:b64EncryptedData options:0];
        return [[Globals sharedInstance].tanker decryptStringFromData:encryptedData].then(^(NSString* clearText) {
          _SecretNotesField.text = clearText;
          [_activityIndicator stopAnimating];
        });
      })
      .catch(^(NSError* error) {
        [_activityIndicator stopAnimating];
        NSLog(@"Could notload data from server: %@", [error localizedDescription]);
      });
}

@end
