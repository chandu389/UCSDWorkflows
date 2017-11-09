/*
Name: F5BigIPNetwork.js
Author: Ruchika Dalal (rucdalal@cisco.com)
Date: 10th October 2017
Version: 1.0
UCSD Version: 6.0.1.1


Description:
This module has the functions to create/modify/delete NETWORK elements in the BIG IP.

FUNCTIONs:
1.	get_CreateVLAN_Json
2.	CreateF5Vlan
3.	DeleteF5Vlan
4.	


*/


//IMPORTS
importPackage(java.util);
importPackage(java.lang);
importPackage(java.io);
importPackage(java.net);
importPackage(com.cloupia.lib.connector.account);
importPackage(com.cloupia.lib.connector.account.credential);
importPackage(org.json);
importPackage(org.json.simple.parser.JSONParser);


/**
  *Function to load other libaries
  *Specify all the dependent Modules here
  */
function Load_Libraries()
{
  loadLibrary("UCSD/CredentialPolicy");
  loadLibrary("Network/Common");
}
Load_Libraries();

var ExecutionPath = "F5/Network";

function echo()
{
    logger.addInfo("Echo echo echo");
}
function create_Vlan(F5Credentials, F5IP, VlanName, VlanTagId, VlanInterface) {

    logger.addInfo("Executing " + ExecutionPath + "/CreateF5Vlan");
    logger.addInfo("--------------------------------Creating F5 VLAN--------------------------------");

    //Get the info from the account.
    var F5Account = getAccount(F5Credentials);
    var F5User = F5Account.getUserName();
    var F5Password = F5Account.getPassword();
    var F5Port = parseInt(String(F5Account.getPort()));
    var F5Protocol = String(F5Account.getProtocal());


    //Show Connection Info.
    logger.addInfo("Using the following parameters from the selected account: " + F5Credentials);
    logger.addInfo(" ---- Username: " + F5User);
    logger.addInfo(" ---- Protocol: " + F5Protocol);
    logger.addInfo(" ---- Port: " + String(F5Port));
    logger.addInfo(" ---- F5  IP: " + F5IP);
    logger.addInfo(" ---- VLAN Name: " + VlanName);
    logger.addInfo(" ---- TagId: " + VlanTagId);
    logger.addInfo(" ---- network Interfaces: " + VlanInterface);
}
 