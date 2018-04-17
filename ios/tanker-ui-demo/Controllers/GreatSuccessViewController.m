//
//  GreatSuccessViewController.m
//  tanker-ui-demo
//
//  Created by Loic on 12/04/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#import "GreatSuccessViewController.h"
#import "Globals.h"
#import "ViewController.h"

@import PromiseKit;

@interface GreatSuccessViewController ()
@property (weak, nonatomic) IBOutlet UITextView *SecretNotesField;

@end

@implementation GreatSuccessViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
 
  [Globals dataFromServer]
  .catch(^(NSError *error){
    NSLog(@"Could not load data from server: %@", [error localizedDescription]);
    return error;
  }).then(^(NSData* encryptedData) {
    if ([encryptedData length] != 0)
    {
      NSString* base64EncodedString = [[NSString alloc] initWithData:encryptedData encoding:NSASCIIStringEncoding];
      NSData* b64DecodedData = [[NSData alloc] initWithBase64EncodedString:base64EncodedString options:0];
      return [[Globals sharedInstance].tanker decryptStringFromData:b64DecodedData];
    }
    return [PMKPromise promiseWithResolver:^(PMKResolver resolve){
      resolve(@"");
    }];
  }).then(^(NSString* clearText) {
    _SecretNotesField.text = clearText;
  }).catch(^(NSError *error){
    NSLog(@"Could not decrypt data: %@", [error localizedDescription]);
    return error;
  });
  
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)triggerLogout:(UIButton *)sender {
  [[Globals sharedInstance].tanker close];
  NSLog(@"Did log out");
  ViewController *controller = [self.storyboard instantiateViewControllerWithIdentifier:@"home"];
  [self.navigationController pushViewController:controller animated:YES];
  
}

- (IBAction)saveNotes:(UIButton *)sender {
  TKREncryptionOptions* encryptionOptions = [TKREncryptionOptions defaultOptions];
  [[Globals sharedInstance].tanker encryptDataFromString:_SecretNotesField.text options:encryptionOptions]
  .catch(^(NSError *error){
    NSLog(@"Could not encrypt data: %@", [error localizedDescription]);
    return error;
  }).then(^(NSData* encryptedData) {
    NSString* base64Encoded = [encryptedData base64EncodedStringWithOptions:0];
    return [Globals uploadToServer:[base64Encoded dataUsingEncoding:NSASCIIStringEncoding allowLossyConversion:YES]];
  }).then(^ {
    // Here display fancy spinner
    NSLog(@"Data sent to server");
  }).catch(^(NSError *error){
    NSLog(@"Could not send data to server: %@", [error localizedDescription]);
    return error;
  });
}

@end
