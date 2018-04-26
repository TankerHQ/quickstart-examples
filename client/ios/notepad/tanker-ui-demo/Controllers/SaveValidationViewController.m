//
//  SaveValidationViewController.m
//  tanker-ui-demo
//
//  Created by Loic on 12/04/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#import "SaveValidationViewController.h"

@interface SaveValidationViewController ()
@property (weak, nonatomic) IBOutlet UITextField *passphraseField;

@end

@implementation SaveValidationViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
}

- (void)viewWillAppear:(BOOL)animated
{
  self->_passphraseField.text = _passphrase;
}


- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

@end
