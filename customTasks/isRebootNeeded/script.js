/**
 * @file
 * This Custom task gets the catalog Details
 *
 *	 INPUTS:
 *		{GenericTextInput} LOV_Name
 *      {GenericTextInput} LOV_Entry_Find
 *		{GenericTextInput} oldCPU
 *		{GenericTextInput} newCPU
 *		{GenericTextInput} oldRAM
 *		{GenericTextInput} newRAM
 *
 *	 OUTPUTS:
 *      {GenericTextInput} isRebootNeeded
 *
 * @author G V R Chandra Reddy <vgolugur@cisco.com>
 * @version  0.1
 * @Date 12 June 2017
 * @namespace isRebootNeeded
 */

importPackage(com.cloupia.service.cIM.inframgr.customactions);
importPackage(java.util);
importPackage(java.lang);

var lovName = input.LOV_Name;
var lovEntryFind = input.LOV_Entry_Find;
var oldCPU = input.oldCPU;
var newCPU = input.newCPU;
var oldRAM = input.oldRAM;
var newRAM = input.newRAM;
var hotRebootVal,isHotPlugEnabled,isRebootNeeded;
logger.addInfo("Looking for LOV entry: "+lovEntryFind);

logger.addInfo("LOV input name1: "+lovName);
lovName = "custom_provider_"+lovName;

var listOfCustomLOV = CustomActionUtil.getWFCustomLovPairs(lovName);
for(var count = 0;count<listOfCustomLOV.size();count++) {
      logger.addInfo(listOfCustomLOV.get(count).getLovLabel()+":"+listOfCustomLOV.get(count).getLovValue());
      if (listOfCustomLOV.get(count).getLovLabel() == lovEntryFind) {
          logger.addInfo("Found the entry returning this: "+listOfCustomLOV.get(count).getLovValue());
          isHotPlugEnabled =listOfCustomLOV.get(count).getLovValue();
          break;
      }
}

listOfCustomLOV = CustomActionUtil.getWFCustomLovPairs("custom_provider_hotReboot");
hotRebootVal    = listOfCustomLOV.get(0).getLovValue();

logger.addInfo("New RAM:"+newRAM + " old RAM:" + oldRAM + " oldCPU:"+oldCPU+ " newCPU:"+newCPU);
logger.addInfo("isHotPlugEnabled: "+isHotPlugEnabled);
logger.addInfo("hotRebootVal: "+hotRebootVal);
if(isHotPlugEnabled == "Yes"){              //Hotplug enabled.
    if(newCPU >= oldCPU){                            //CPU is increased or remained same.
        if(newRAM > oldRAM){                            //RAM increased
            if(newRAM <= hotRebootVal){
                isRebootNeeded = "No";                      //Not exceeded value for hot reboot.
            }else{
                isRebootNeeded = "Yes";                     // Exceeded value for hot reboot.
            }
        }else if(newRAM == oldRAM){                      //RAM Unchanged.
            isRebootNeeded = "No";
        }else{                         // RAM decreased.
            isRebootNeeded = "Yes";
        }
    }else{                                     //CPU is decreased.
        isRebootNeeded = "Yes";
    }
}else{
    isRebootNeeded == "No";                //Hotplug is not enabled.
}

output.isRebootNeeded = isRebootNeeded;
