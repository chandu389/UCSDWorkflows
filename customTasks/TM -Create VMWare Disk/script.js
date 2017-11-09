/*

Name: TM-Create-VMWare-Disk.js

Author: Rizwan Sarwar (risarwar@cisco.com)

Date: 23rd Feburary 2016

Version: 0.1



Description:

	Create VMWare Disk



	//INPUTS:

		CustomerName: [GenericTextInput] MANDATORY --> Customer Name

		CustomerVlan: [GenericTextInput] MANDATORY --> Customer VLAN

		ClusterName:  [GenericTextInput] MANDATORY --> Clust Name to provision VM

		StorageTeir:  [GenericTextInput] MANDATORY --> Storage Teir of VM

		CloudType:    [GenericTextInput] MANDATORY --> Cloud Type

		CatalogName: [GenericTextInput] MANDATORY --> The catalog Name



	//OUTPUTS:

		vdcId

		OUTPUT_VDC_NAME;





*/
//IMPORTS
importPackage(java.lang);
importPackage(java.util);
importPackage(com.cloupia.service.cIM.inframgr);



// Auto generated to code invoke following task
// Task Label:  Create VM Disk
// Task Name:  Create VM Disk

function Create_VM_Disk(vmId, diskSizeGB, diskType, dataStoreName)
{
    var task = ctxt.createInnerTaskContext("Create VM Disk");

    // Input 'Select VM', mandatory=true, mappableTo=vm
    task.setInput("Select VM", input.vmId);

    // Input 'Disk Size (GB)', mandatory=true, mappableTo=gen_text_input
    task.setInput("Disk Size (GB)", input.diskSize);

    // Input 'Select Disk Type', mandatory=false, mappableTo=DiskType
    task.setInput("Select Disk Type", input.diskType);

    // Input 'Select Datastore', mandatory=false, mappableTo=dataStoreName
    task.setInput("Select Datastore", input.datastoreName);

    // Input 'Thin Provisioning', mandatory=false, mappableTo=
    task.setInput("Thin Provisioning", true);


    // Now execute the task. If the task fails, then it will throw an exception
    task.execute();

}

var vmId = input.vmId;
var vmName = String(input.vmName);
var diskSizeGB = input.diskSize;
var diskType = "Data";
var dataStoreName = String(input.dataStoreName);
var cloudName = String(input.cloudName);

var oldDisks = new HashMap();
var vmDisks = InfraPersistenceUtil.getVMDiskConfigByCloudAndVMName(cloudName, vmName);
for(var i=0; i< vmDisks.size(); i++ ){
    oldDisks.put("disk_" + i + "_label",  vmDisks.get(i).getLabel());
    oldDisks.put("disk_" + i + "_uuid",  vmDisks.get(i).getUuid());
    oldDisks.put("disk_" + i + "_type",  vmDisks.get(i).getDiskType());
}
// Invoke the task
Create_VM_Disk(vmId, diskSizeGB, diskType, dataStoreName);

var newDisks = InfraPersistenceUtil.getVMDiskConfigByCloudAndVMName(cloudName, vmName);
for(var i=0; i < newDisks.size(); i++ ){
    if( !oldDisks.containsKey("disk_" + i + "_label") &&
        oldDisks.get("disk_" + i + "_label") !== newDisks.get(i).getLabel() ){
            output.OUTPUT_NEW_DISK_LABEL = newDisks.get(i).getLabel();
            output.OUTPUT_NEW_DISK_UUID = newDisks.get(i).getUuid()
            break;
        }
}

