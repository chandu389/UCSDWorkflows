/**
 * @file
 * Enable executing scripts locally on the PS Agent checking for errors and enabling rollback.
 *
 *	 INPUTS:
 *		{GenericTextInput} PSAgent PSA Agent to execute the script [MANDATORY]
 *		{GenericTextInput} scriptName Full path to Script (No spaces recomended) [MANDATORY]
 *		{GenericTextInput} parameters Parameters for the Script [MANDATORY]
 *		{GenericTextInput} rollbackScriptName Full path for the Rollback Script [OPTIONAL]
 *		{GenericTextInput} rollbackParameters Parameters for the Rollback Script [OPTIONAL]
 *		{GenericTextInput} maxWaitMinutes Maximum time for script to finish [MANDATORY]
 *	OUTPUTS:
 * 		{GenericTextInput} SCRIPT_OUTPUT The Script OUTPUT.
 *
 *
 * @author Alex Madurga (almadurg@cisco.com)
 * @version 1.0 - UCSD 5.3.2.1
 * @Date March 2016
 * @namespace TM-ExecutePSScript
 *
 */

/*########IMPORTS############*/
importPackage(com.cloupia.lib.connector.account);
importPackage(com.cloupia.feature.powershellAgentController.wftasks);
importPackage(com.cloupia.lib.connector.account.credential);
importPackage(com.cloupia.feature.powershellAgentController);

/*#### END OF IMPORTS #######*/

/*FUNCTIONS*/

/**
 * Get the Credentials from the Credentials policy.
 *
 * @param {string} accountName
 *
 * @return {account} account with the username, password, port and protocol.
 *
 * @memberof TM-ExecutePSScript
 */
function getAccount(accountName){
	logger.addInfo("Looking for the following account:" + accountName);
	var account = PersistenceUtil.getCredentialPolicyByName(accountName);
	if (account != null){
		logger.addInfo("Account:" + accountName + " found.");
		return account;
	}
	else{
		logger.addError("Account:" + accountName + " NOT found.");
		ctxt.setFailed("No Account found with name: " + accountName);
		ctxt.exit();
	}
}
/**
 * Get the IP for a given PS Agent.
 *
 * @param {string} PSAAgent Name : The name of the PSA Account.
 *
 * @return {string} The IP address for the PS Agent.
 *
 * @memberof TM-ExecutePSScript
 */
function getPSAIP(PSAgentName)
{
	var psAgent = PowershellPersistenceUtil.getPowershellAgentByName(PSAgentName);
    if( psAgent !== null ){
        return psAgent.getAddress();
    } else {
	    ctxt.setFailed("No PS Agent found with name " + PSAgentName);
	    ctxt.exit();
    }
}

/**
 * Execute a Powershell command on the PS Agent itself, with rollback capabilities.
 *
 * @param {string} PSAgent : The PSA Agent Name
 * @param {CredentialPolicy} PSACredentials : The credentials to connecto to the PS Agent.
 * @param {string}  script : The script and the parameters to execute on the PS Agent.
 * @param {string} rollbackScript : The script for the rollback.
 *
 * @memberof TM-ExecutePSScript
 */
function Execute_PowerShell_Command(PSAgent,PSACredentials,script,rollbackScript,maxWaitMinutes)
{
    var task = ctxt.createInnerTaskContext("Execute PowerShell Command");
    task.setInput("Label", "PSA Script");
    task.setInput("PowerShell Agent", getPSAIP(PSAgent));
    task.setInput("Target Machine IP", getPSAIP(PSAgent));
    task.setInput("User ID", PSACredentials.getUserName());
    task.setInput("Password", PSACredentials.getPassword());
    task.setInput("Domain", PSACredentials.getCredentialPojo().gethDomain());
    task.setInput("Commands/Script", script);
    task.setInput("Maximum Wait Time", maxWaitMinutes);
    task.execute();
    // Now copy the outputs of the inner task for use by subsequent tasks
    // Type of following output: gen_text_input
    var result = String(task.getOutput("POWERSHELL_COMMAND_RESULT"));
    result = result.toUpperCase();
    if (result.indexOf("FAIL")>-1)
    {
    	ctxt.setFailed(result);
    	ctxt.exit();
    }
    else
    {
		if (rollbackScript.length > 0)
		{
			registerUndoTask(PSAgent,PSACredentials,rollbackScript,maxWaitMinutes);
		}
    }
	return result;
}


/**
 * Rollback the PS Script with antother script task
 * @param {string} PSAgent : The PSA Agent Name
 * @param {CredentialPolicy} PSACredentials : The credentials to connecto to the PS Agent.
 * @param {string}  rollbackScript : The script and the parameters to execute on the PS Agent.
 * @param {string} maxWaitMinutes : The script for the rollback.
 *
 * @memberof TM-ExecutePSScript
 */

function registerUndoTask(PSAgent,PSACredentials,rollbackScript,maxWaitMinutes)
{
	var handler = "Execute PowerShell Command";
	var task = ctxt.createInnerTaskContext("Execute PowerShell Command");
	task.setInput("Label", "PSA Script");
    task.setInput("PowerShell Agent", getPSAIP(PSAgent));
    task.setInput("Target Machine IP", getPSAIP(PSAgent));
    task.setInput("User ID", PSACredentials.getUserName());
    task.setInput("Password", PSACredentials.getPassword());
    task.setInput("Domain", PSACredentials.getCredentialPojo().gethDomain());
    task.setInput("Commands/Script", rollbackScript);
    task.setInput("Maximum Wait Time", maxWaitMinutes);
	ctxt.getChangeTracker().undoableResourceModified("Rollback Powershell Script.",
            String(ctxt.getSrId()),
            "Powershell script",
			"Rollback Powershell Script",
            handler,
            task.getConfigObject());
}

/*MAIN*/

/*Clean Inputs*/
var PSAgent = String(input.PSAgent);
var scriptName = String(input.scriptName);
var parameters = String(input.parameters);
var rollbackScriptName = String(input.rollbackScriptName);
var rollbackParameters = String(input.rollbackParameters);
var maxWaitMinutes = String(input.maxWaitMinutes);
var PSACredentials = getAccount(PSAgent);

var script = scriptName + " " + parameters;
var rollbackScript = "";
if (rollbackScriptName.length > 0)
{
	var rollbackScript = rollbackScriptName + " " + rollbackParameters;
}

var result = String(Execute_PowerShell_Command(PSAgent,PSACredentials,script,rollbackScript,maxWaitMinutes));
logger.addInfo("Command Outputs is"+result);
if (result.indexOf("PASS") > -1)
{
	var IP = result.split("PASS")[1];
	IP = IP.split(" ")[0];
	output.SCRIPT_OUTPUT = IP;
}
else
{
	output.SCRIPT_OUTPUT = "";
}


