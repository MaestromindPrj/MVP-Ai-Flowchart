const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.processMessage.deleteMany();
  await prisma.processParticipant.deleteMany();
  await prisma.processVersion.deleteMany();
  await prisma.process.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: {
      name: "Acme Global Enterprises",
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "Alex Morgan",
      email: "alex@jvprocess.com",
      role: "Senior Process Consultant",
      organizationId: org.id,
    },
  });

  const orderNodesV3 = [
    {
      id: "node-1",
      type: "start",
      label: "Order Received",
      role: "Sales Executive",
      description: "Customer submits purchase order via portal or email.",
      position: { x: 250, y: 50 },
    },
    {
      id: "node-2",
      type: "task",
      label: "Create Sales Order",
      role: "Sales Executive",
      description: "Enter order details into ERP system and verify pricing.",
      sla: "2 hours",
      required: true,
      position: { x: 250, y: 180 },
    },
    {
      id: "node-3",
      type: "approval",
      label: "Manager Approval",
      role: "Sales Manager",
      description: "Review customer order, discount thresholds, and credit terms.",
      sla: "4 hours",
      required: true,
      position: { x: 250, y: 320 },
    },
    {
      id: "node-4",
      type: "decision",
      label: "High Value Order?",
      role: "System Rule",
      description: "Check if order total exceeds $10,000 threshold.",
      condition: "Total > $10,000",
      position: { x: 250, y: 470 },
    },
    {
      id: "node-5",
      type: "approval",
      label: "Finance Approval",
      role: "Finance Director",
      description: "Conduct financial risk assessment and executive credit sign-off.",
      sla: "24 hours",
      required: true,
      position: { x: 500, y: 470 },
    },
    {
      id: "node-6",
      type: "task",
      label: "Inventory Allocation",
      role: "Inventory Team",
      description: "Reserve stock in warehouse management system.",
      sla: "4 hours",
      required: true,
      position: { x: 250, y: 620 },
    },
    {
      id: "node-7",
      type: "task",
      label: "Payment Verification",
      role: "Accounts Receivable",
      description: "Confirm advance payment or verify active credit terms.",
      sla: "2 hours",
      required: true,
      position: { x: 250, y: 760 },
    },
    {
      id: "node-8",
      type: "task",
      label: "Pick, Pack & Dispatch",
      role: "Logistics Lead",
      description: "Generate bill of lading and dispatch shipment to carrier.",
      sla: "8 hours",
      required: true,
      position: { x: 250, y: 900 },
    },
    {
      id: "node-9",
      type: "end",
      label: "Order Fulfilled",
      role: "Customer Success",
      description: "Tracking details shared with customer and order archived.",
      position: { x: 250, y: 1040 },
    },
  ];

  const orderEdgesV3 = [
    { id: "e1-2", source: "node-1", target: "node-2" },
    { id: "e2-3", source: "node-2", target: "node-3" },
    { id: "e3-4", source: "node-3", target: "node-4" },
    { id: "e4-5", source: "node-4", target: "node-5", label: "Yes (> $10k)" },
    { id: "e4-6", source: "node-4", target: "node-6", label: "No (<= $10k)" },
    { id: "e5-6", source: "node-5", target: "node-6", label: "Approved" },
    { id: "e6-7", source: "node-6", target: "node-7" },
    { id: "e7-8", source: "node-7", target: "node-8" },
    { id: "e8-9", source: "node-8", target: "node-9" },
  ];

  const orderProcess = await prisma.process.create({
    data: {
      organizationId: org.id,
      name: "Order Management",
      description: "End-to-end customer order processing, credit check, approval hierarchy, inventory allocation, and fulfillment workflow.",
      department: "Sales",
      ownerName: "Sales Operations",
      ownerEmail: "sales-ops@acme.com",
      status: "Draft",
      currentVersionNumber: 3,
      participants: {
        create: [
          { name: "Sales Executive", role: "Order Creator" },
          { name: "Sales Manager", role: "First Line Approver" },
          { name: "Finance Director", role: "High-Value Approver" },
          { name: "Inventory Specialist", role: "Stock Fulfillment" },
          { name: "Logistics Lead", role: "Shipping & Dispatch" },
        ],
      },
      messages: {
        create: [
          {
            senderType: "AI",
            message: "Hello Alex! I am your AI Process Assistant. Let's map your Order Management process. How does an order start?",
          },
          {
            senderType: "USER",
            message: "The sales executive receives the customer order and enters it into the ERP system.",
          },
          {
            senderType: "AI",
            message: "I've added 'Order Received' and 'Create Sales Order' to the flowchart. Who approves this order before fulfillment?",
          },
          {
            senderType: "USER",
            message: "The sales manager approves it, but if it exceeds $10,000, it also needs Finance Director approval.",
          },
          {
            senderType: "AI",
            message: "Understood! I've structured the Manager Approval step and added a conditional decision branch for orders exceeding $10,000 leading to Finance Approval.",
          },
        ],
      },
    },
  });

  const v1Data = {
    nodes: orderNodesV3.slice(0, 3).concat([orderNodesV3[8]]),
    edges: [
      { id: "e1-2", source: "node-1", target: "node-2" },
      { id: "e2-3", source: "node-2", target: "node-3" },
      { id: "e3-9", source: "node-3", target: "node-9" },
    ],
  };

  const v2Data = {
    nodes: orderNodesV3.slice(0, 4).concat([orderNodesV3[5], orderNodesV3[7], orderNodesV3[8]]),
    edges: [
      { id: "e1-2", source: "node-1", target: "node-2" },
      { id: "e2-3", source: "node-2", target: "node-3" },
      { id: "e3-4", source: "node-3", target: "node-4" },
      { id: "e4-6", source: "node-4", target: "node-6" },
      { id: "e6-8", source: "node-6", target: "node-8" },
      { id: "e8-9", source: "node-8", target: "node-9" },
    ],
  };

  const v3Data = {
    nodes: orderNodesV3,
    edges: orderEdgesV3,
  };

  const ver1 = await prisma.processVersion.create({
    data: {
      processId: orderProcess.id,
      versionNumber: 1,
      processData: JSON.stringify(v1Data),
      createdBy: "Alex Morgan",
      changeSummary: "Initial Process Baseline",
    },
  });

  const ver2 = await prisma.processVersion.create({
    data: {
      processId: orderProcess.id,
      versionNumber: 2,
      processData: JSON.stringify(v2Data),
      createdBy: "Alex Morgan",
      changeSummary: "Added Inventory Allocation and Dispatch steps",
    },
  });

  const ver3 = await prisma.processVersion.create({
    data: {
      processId: orderProcess.id,
      versionNumber: 3,
      processData: JSON.stringify(v3Data),
      createdBy: "Alex Morgan",
      changeSummary: "Added Finance Approval for High-Value Orders (> $10k)",
    },
  });

  await prisma.process.update({
    where: { id: orderProcess.id },
    data: { currentVersionId: ver3.id },
  });

  const salesNodes = [
    {
      id: "sn-1",
      type: "start",
      label: "Lead Ingestion",
      role: "Marketing SDR",
      description: "Inbound lead qualified via BANT criteria.",
      position: { x: 250, y: 50 },
    },
    {
      id: "sn-2",
      type: "task",
      label: "Discovery Call",
      role: "Account Executive",
      description: "Determine technical requirements and timeline.",
      sla: "3 days",
      required: true,
      position: { x: 250, y: 180 },
    },
    {
      id: "sn-3",
      type: "task",
      label: "Solution Demonstration",
      role: "Solutions Engineer",
      description: "Tailored product walkthrough and POC setup.",
      sla: "5 days",
      required: true,
      position: { x: 250, y: 320 },
    },
    {
      id: "sn-4",
      type: "approval",
      label: "Pricing Approval",
      role: "VP of Sales",
      description: "Approve custom deal terms and payment schedule.",
      sla: "24 hours",
      required: true,
      position: { x: 250, y: 460 },
    },
    {
      id: "sn-5",
      type: "task",
      label: "Contract Execution",
      role: "Legal & Customer",
      description: "Sign MSA and Order Form via e-signature.",
      sla: "48 hours",
      required: true,
      position: { x: 250, y: 600 },
    },
    {
      id: "sn-6",
      type: "end",
      label: "Customer Onboarded",
      role: "Customer Success",
      description: "Handover to Implementation team.",
      position: { x: 250, y: 740 },
    },
  ];

  const salesEdges = [
    { id: "se-1-2", source: "sn-1", target: "sn-2" },
    { id: "se-2-3", source: "sn-2", target: "sn-3" },
    { id: "se-3-4", source: "sn-3", target: "sn-4" },
    { id: "se-4-5", source: "sn-4", target: "sn-5" },
    { id: "se-5-6", source: "sn-5", target: "sn-6" },
  ];

  const salesProcess = await prisma.process.create({
    data: {
      organizationId: org.id,
      name: "Sales Process",
      description: "Enterprise sales pipeline qualification, technical demo, discounting approval, and contract execution.",
      department: "Sales",
      ownerName: "Chief Commercial Officer",
      ownerEmail: "cco@acme.com",
      status: "Finalized",
      currentVersionNumber: 2,
      participants: {
        create: [
          { name: "SDR Team", role: "Lead Qualification" },
          { name: "Account Executive", role: "Opportunity Owner" },
          { name: "VP of Sales", role: "Pricing Sign-off" },
          { name: "Legal Counsel", role: "Contract Review" },
        ],
      },
    },
  });

  const salesVer = await prisma.processVersion.create({
    data: {
      processId: salesProcess.id,
      versionNumber: 2,
      processData: JSON.stringify({ nodes: salesNodes, edges: salesEdges }),
      createdBy: "Alex Morgan",
      changeSummary: "Finalized Enterprise Sales Standard Operating Procedure",
    },
  });

  await prisma.process.update({
    where: { id: salesProcess.id },
    data: { currentVersionId: salesVer.id },
  });

  const purchaseNodes = [
    {
      id: "pn-1",
      type: "start",
      label: "Requisition Submitted",
      role: "Department Requestor",
      description: "Internal requisition for hardware or cloud services.",
      position: { x: 250, y: 50 },
    },
    {
      id: "pn-2",
      type: "approval",
      label: "Budget Sign-off",
      role: "Department Head",
      description: "Verify departmental budget availability.",
      sla: "24 hours",
      required: true,
      position: { x: 250, y: 180 },
    },
    {
      id: "pn-3",
      type: "task",
      label: "Vendor Evaluation",
      role: "Procurement Specialist",
      description: "Compare RFP quotes and compliance credentials.",
      sla: "3 days",
      required: true,
      position: { x: 250, y: 320 },
    },
    {
      id: "pn-4",
      type: "task",
      label: "Issue Purchase Order",
      role: "Procurement Specialist",
      description: "Generate binding PO and send to vendor.",
      sla: "4 hours",
      required: true,
      position: { x: 250, y: 460 },
    },
    {
      id: "pn-5",
      type: "end",
      label: "PO Dispatched",
      role: "Finance AP",
      description: "PO linked to accounting system for 3-way match.",
      position: { x: 250, y: 600 },
    },
  ];

  const purchaseEdges = [
    { id: "pe-1-2", source: "pn-1", target: "pn-2" },
    { id: "pe-2-3", source: "pn-2", target: "pn-3" },
    { id: "pe-3-4", source: "pn-3", target: "pn-4" },
    { id: "pe-4-5", source: "pn-4", target: "pn-5" },
  ];

  const purchaseProcess = await prisma.process.create({
    data: {
      organizationId: org.id,
      name: "Purchase Process",
      description: "Procurement governance, vendor RFP qualification, budget approval, and purchase order fulfillment.",
      department: "Operations",
      ownerName: "Procurement Director",
      ownerEmail: "procurement@acme.com",
      status: "Draft",
      currentVersionNumber: 1,
      participants: {
        create: [
          { name: "Department Head", role: "Budget Approver" },
          { name: "Procurement Lead", role: "Vendor Specialist" },
          { name: "Accounts Payable", role: "Payment Operations" },
        ],
      },
    },
  });

  const purchaseVer = await prisma.processVersion.create({
    data: {
      processId: purchaseProcess.id,
      versionNumber: 1,
      processData: JSON.stringify({ nodes: purchaseNodes, edges: purchaseEdges }),
      createdBy: "Alex Morgan",
      changeSummary: "Initial Procurement Flowchart Draft",
    },
  });

  await prisma.process.update({
    where: { id: purchaseProcess.id },
    data: { currentVersionId: purchaseVer.id },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
