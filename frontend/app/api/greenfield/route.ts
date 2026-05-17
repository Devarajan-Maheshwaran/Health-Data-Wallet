import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { Client } = await import('@bnb-chain/greenfield-js-sdk');
    
    const GREENFIELD_RPC = process.env.NEXT_PUBLIC_GREENFIELD_RPC ?? 'https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org';
    const GREENFIELD_CHAIN_ID = process.env.NEXT_PUBLIC_GREENFIELD_CHAIN_ID ?? '5600';
    const SP_ADDRESS = process.env.NEXT_PUBLIC_SP_ADDRESS ?? '';
    
    const client = Client.create(GREENFIELD_RPC, GREENFIELD_CHAIN_ID);
    
    const formData = await req.formData();
    const action = formData.get('action');
    const walletAddress = formData.get('walletAddress') as string;
    
    if (!walletAddress) return NextResponse.json({ error: 'Missing walletAddress' }, { status: 400 });
    
    const bucketName = `medvault-${walletAddress.toLowerCase().slice(2, 18)}`;
    
    if (action === 'ensureBucket') {
      try {
        await client.bucket.headBucket(bucketName);
      } catch {
        await (client.bucket as any).createBucket({
          bucketName,
          creator: walletAddress,
          visibility: 'VISIBILITY_TYPE_PRIVATE',
          primarySpAddress: SP_ADDRESS,
          paymentAddress: walletAddress,
        });
      }
      return NextResponse.json({ success: true });
    }
    
    if (action === 'upload') {
      const recordId = Number(formData.get('recordId'));
      const version = Number(formData.get('version'));
      const objName = `record-${recordId}-v${version}.enc`;
      
      const file = formData.get('file') as Blob;
      if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 });
      
      const buffer = await file.arrayBuffer();
      const { RedundancyType } = await import('@bnb-chain/greenfield-js-sdk');
      const checksums = await (client.object as any).computeHashRoots(buffer);
      
      const createTx = await (client.object as any).createObject({
        bucketName,
        objectName: objName,
        creator: walletAddress,
        visibility: 'VISIBILITY_TYPE_PRIVATE',
        contentType: 'application/octet-stream',
        redundancyType: RedundancyType.REDUNDANCY_EC_TYPE,
        payloadSize: BigInt(buffer.byteLength) as any,
        expectChecksums: checksums,
      });
      
      await (client.object as any).putObject({
        bucketName,
        objectName: objName,
        body: file,
        txnHash: (createTx as any).transactionHash,
      });
      
      return NextResponse.json({ objectName: objName, txHash: (createTx as any).transactionHash });
    }
    
    if (action === 'download') {
      const recordId = Number(formData.get('recordId'));
      const version = Number(formData.get('version'));
      const objName = `record-${recordId}-v${version}.enc`;
      
      const res = await (client.object as any).getObject({
        bucketName,
        objectName: objName,
      });
      
      if (res.body instanceof Blob) {
        const arrayBuffer = await res.body.arrayBuffer();
        return new NextResponse(arrayBuffer);
      }
      
      const reader = (res.body as unknown as ReadableStream).getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      const total = chunks.reduce((s, c) => s + c.byteLength, 0);
      const combined = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.byteLength; }
      
      return new NextResponse(combined.buffer);
    }
    
    if (action === 'delete') {
      const recordId = Number(formData.get('recordId'));
      const version = Number(formData.get('version'));
      const objName = `record-${recordId}-v${version}.enc`;
      
      await client.object.deleteObject({
        bucketName,
        objectName: objName,
        operator: walletAddress,
      });
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
