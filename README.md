# Repository Setup Instructions

Follow the steps below **In Order** to create and configure the repository using the **poa-blank-template**.

---

## 1. Create the Repository

1. In GitHub, click the **+** icon in the top right corner and select **New repository**.
2. Under **Repository template**, select **poa-blank-template**.
3.  Check this option: **Include all branches**.
4. Ensure that the **Owner** to: `GSA` .
5. **Repository Name**: Name the repository appropriately. For example, you might name it `poa-docs` (you can rename it later if needed).
6. **Visibility**: Set the repository to **Private**.
7. (Optional) Check **Create a README file** if desired. Leave the rest of the options as-is.
8. Click **Create repository**.

<img src="img/Instruction_1.gif" width="800" height="auto" alt="Instruction_1">

----

## 2. Configure Repository Settings

### a. Set Up Collaborators and Teams

1. Navigate to the **Settings** tab of your newly created repository.
2. Under **Access** > **Collaborators and teams**, click on the **Add teams** button.
3. Add the following teams with their associated access levels:
   - **PO&A Team** – *Read*
   - **PO&A Dev Team** – *Write*
   - **PO&A Admin Team** – *Admin*

> [!TIP]
> *You can copy/paste `po-a` below to quickly locate the teams.*

```c++
po-a
```


<img src="img/Instruction_2.gif" width="800" height="auto" alt="Instruction_2">

### b. Import Rulesets

First download these ruleset from this link: [PO&A Default](https://github.com/Orrin-GSA/Example/blob/main/assest/PO%26A_Default.json "download")
- On the right hand corner, go to **&darr;** icon to download the file. 


1. Go to **Code and automation** > **Rules** > **Rulesets**.
2. Click on **New ruleset**.
3. Select **Import a ruleset**.
4. Upload the attached JSON file and wait for it to load.
5. Once loaded, click **Save**.

<img src="img/Instruction_3.gif" width="800" height="auto" alt="Instruction_3">

### c. Remove Your Direct Access

> [!CAUTION]
> Verify that all settings and permissions are correctly applied.
>This step must be performed after importing the ruleset. Otherwise, you will not be able to add the rulesets. 
>If you have not done this yet please do so! 

1. Return to **Access** > **Collaborators and teams**.
2. Remove yourself from the direct access list.


   
<img src="img/Instruction_4.gif" width="800" height="auto" alt="Instruction_4">

----



