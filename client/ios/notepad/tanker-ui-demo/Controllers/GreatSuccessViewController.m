//
//  GreatSuccessViewController.m
//  tanker-ui-demo
//
//  Created by Loic on 12/04/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#import "GreatSuccessViewController.h"
#import "Globals.h"

@import PromiseKit;

@interface GreatSuccessViewController ()
@property UIActivityIndicatorView* activityIndicator;

@property (weak, nonatomic) IBOutlet UITextView *SecretNotesField;
@property (weak, nonatomic) IBOutlet UITextField *shareWithField;
@property (weak, nonatomic) IBOutlet UILabel *errorLabel;

@end

@implementation GreatSuccessViewController

- (PMKPromise<NSString*>*)decryptDataWithTanker:(NSData*)encryptedData
{
  if (encryptedData.length != 0)
  {
    return [[Globals sharedInstance].tanker decryptStringFromData:encryptedData]
    .catch(^(NSError *error){
      [_activityIndicator stopAnimating];
      NSLog(@"Could not decrypt data: %@", [error localizedDescription]);
      return error;
    });
  }
  return [PMKPromise promiseWithValue:@""];
}

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
  
  _activityIndicator = [[UIActivityIndicatorView alloc]initWithFrame:CGRectMake(self.view.bounds.size.width / 2 - 25, self.view.bounds.size.height / 2 - 25, 50, 50)];
  [_activityIndicator setActivityIndicatorViewStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [_activityIndicator setColor:[UIColor blueColor]];
  [self.view addSubview:_activityIndicator];
  [_activityIndicator startAnimating];
  [Globals dataFromServer].
  then(^(NSData* encryptedData) {
    // needed?
    return [self decryptDataWithTanker:encryptedData];
  }).then(^(NSString* clearText) {
    _SecretNotesField.text = clearText;
    [_activityIndicator stopAnimating];
  }).catch(^(NSError* error){
    [_activityIndicator stopAnimating];
    // TODO constant
    if ([error.domain isEqualToString:@"io.tanker-ui-demo"] && error.code == 404)
      _SecretNotesField.text = @"";
  });
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)saveNotes:(UIButton *)sender {
  [_activityIndicator startAnimating];
  [[Globals sharedInstance].tanker encryptDataFromString:_SecretNotesField.text]
  .then(^(NSData* encryptedData) {
    NSString* base64Encoded = [encryptedData base64EncodedStringWithOptions:0];
    return [Globals uploadToServer:[base64Encoded dataUsingEncoding:NSASCIIStringEncoding allowLossyConversion:YES]];
  }).then(^ {
    [_activityIndicator stopAnimating];
    NSLog(@"Data sent to server");
  }).catch(^(NSError *error){
    [_activityIndicator stopAnimating];
    NSLog(@"Could not encrypt and send data to server: %@", [error localizedDescription]);
  });
}

- (IBAction)shareWith:(UIButton *)sender {
  NSString* recipientUserId = _shareWithField.text;
  
  if ([recipientUserId stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]].length == 0)
  {
    _errorLabel.text = @"Recipient is empty or filled with blanks";
    return;
  }
  [_activityIndicator startAnimating];
  
  [Globals dataFromServer]
  .then(^(NSData* encryptedData) {
    TKRTanker* tanker = [Globals sharedInstance].tanker;
    NSError* err = nil;
    NSString* resourceId = [tanker resourceIDOfEncryptedData:encryptedData error:&err];
    if (err)
      return [PMKPromise promiseWithValue:err];
    return [tanker shareResourceIDs:@[resourceId] toUserIDs:@[recipientUserId]].then(^{
    return [Globals shareNoteWith:@[recipientUserId]];
    });
    }).then(^ {
    [_activityIndicator stopAnimating];
    NSLog(@"Data shared with user: %@", recipientUserId);
  }).catch(^(NSError *error){
    [_activityIndicator stopAnimating];
    NSLog(@"Could not encrypt & share and send data to server: %@", [error localizedDescription]);
  });
}

- (IBAction)loadFrom:(UIButton *)sender {
  NSString* senderUserId = _shareWithField.text;
  
  if ([senderUserId stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]].length == 0)
  {
    _errorLabel.text = @"Sender is empty or filled with blanks";
    return;
  }
  [_activityIndicator startAnimating];
  
  [Globals getDataFromUser:senderUserId].then(^(NSData* encryptedData) {
    return [self decryptDataWithTanker:encryptedData];
  }).then(^(NSString* clearText) {
    _SecretNotesField.text = clearText;
    [_activityIndicator stopAnimating];
  }).catch(^(NSError *error){
    [_activityIndicator stopAnimating];
    NSLog(@"Could notload data from server: %@", [error localizedDescription]);
  });
}

@end
