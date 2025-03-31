import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { useContract } from '@/hooks/useContract';
import { 
  generateRangeProof, 
  generateVaccinationProof, 
  generateRecordExistenceProof,
  formatProofForBlockchain,
  generateProofHash
} from '@/utils/zk-proofs';

/**
 * Component for generating zero-knowledge proofs related to health data
 */
const ZKProofGenerator = () => {
  const { toast } = useToast();
  const { account } = useWallet();
  const { submitProofToBlockchain } = useContract();
  
  // State for proof generation
  const [proofType, setProofType] = useState('range');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedProof, setGeneratedProof] = useState(null);
  const [proofHash, setProofHash] = useState('');
  
  // State for range proof
  const [actualValue, setActualValue] = useState('');
  const [lowerBound, setLowerBound] = useState('');
  const [upperBound, setUpperBound] = useState('');
  
  // State for vaccination proof
  const [vaccinations, setVaccinations] = useState('COVID-19, Influenza, Hepatitis B');
  const [requiredVaccination, setRequiredVaccination] = useState('COVID-19');
  
  // State for record existence proof
  const [recordHash, setRecordHash] = useState('0x1234567890abcdef');
  const [patientId, setPatientId] = useState('12345');
  const [recordType, setRecordType] = useState('medical_history');
  
  /**
   * Generate proof based on selected type
   */
  const handleGenerateProof = async () => {
    try {
      setIsGenerating(true);
      
      let proof;
      
      // Generate appropriate proof based on type
      switch (proofType) {
        case 'range':
          // Validate inputs
          if (!actualValue || !lowerBound || !upperBound) {
            throw new Error('All fields are required for range proof');
          }
          
          proof = await generateRangeProof({
            actualValue: parseFloat(actualValue),
            lowerBound: parseFloat(lowerBound),
            upperBound: parseFloat(upperBound)
          });
          break;
          
        case 'vaccination':
          // Validate inputs
          if (!vaccinations || !requiredVaccination) {
            throw new Error('Vaccination information is required');
          }
          
          proof = await generateVaccinationProof({
            vaccinations: vaccinations.split(',').map(v => v.trim()),
            requiredVaccination
          });
          break;
          
        case 'record':
          // Validate inputs
          if (!recordHash || !patientId || !recordType) {
            throw new Error('Record information is required');
          }
          
          proof = await generateRecordExistenceProof({
            recordHash,
            patientId,
            recordType
          });
          break;
          
        default:
          throw new Error('Invalid proof type');
      }
      
      // Calculate proof hash for reference
      const hash = generateProofHash(proof);
      
      setGeneratedProof(proof);
      setProofHash(hash);
      
      toast({
        title: 'Proof Generated',
        description: 'Zero-knowledge proof has been successfully generated',
      });
    } catch (error) {
      console.error('Error generating proof:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate proof',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Submit the generated proof to blockchain
   */
  const handleSubmitProof = async () => {
    try {
      if (!generatedProof) {
        throw new Error('Generate a proof first');
      }
      
      if (!account) {
        throw new Error('Connect your wallet first');
      }
      
      setIsSubmitting(true);
      
      const formattedProof = formatProofForBlockchain(generatedProof);
      
      // In a real implementation, this would submit the proof to a smart contract
      // For this demo, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // This would be the real transaction submission
      // const txHash = await submitProofToBlockchain(formattedProof);
      const txHash = '0x' + Math.random().toString(16).substring(2);
      
      toast({
        title: 'Proof Submitted',
        description: `Successfully submitted proof to blockchain. TX: ${txHash.substring(0, 10)}...`,
      });
    } catch (error) {
      console.error('Error submitting proof:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit proof',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * Reset the form and generated proof
   */
  const handleReset = () => {
    setGeneratedProof(null);
    setProofHash('');
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Zero-Knowledge Proof Generator</CardTitle>
        <CardDescription>
          Generate and verify proofs without revealing sensitive medical data
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="proof-type">Proof Type</Label>
          <Select value={proofType} onValueChange={(value) => {
            setProofType(value);
            setGeneratedProof(null);
            setProofHash('');
          }}>
            <SelectTrigger id="proof-type">
              <SelectValue placeholder="Select proof type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="range">Health Metric Range</SelectItem>
              <SelectItem value="vaccination">Vaccination Status</SelectItem>
              <SelectItem value="record">Record Existence</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Fields for Range Proof */}
        {proofType === 'range' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="actual-value">Actual Value (Hidden from Verifier)</Label>
              <Input
                id="actual-value"
                type="number"
                placeholder="e.g., 120 for blood pressure"
                value={actualValue}
                onChange={(e) => setActualValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is your private data that won't be revealed
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lower-bound">Lower Bound (Public)</Label>
                <Input
                  id="lower-bound"
                  type="number"
                  placeholder="e.g., 90"
                  value={lowerBound}
                  onChange={(e) => setLowerBound(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="upper-bound">Upper Bound (Public)</Label>
                <Input
                  id="upper-bound"
                  type="number"
                  placeholder="e.g., 140"
                  value={upperBound}
                  onChange={(e) => setUpperBound(e.target.value)}
                />
              </div>
            </div>
            
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm">
                This proof will verify your value is within the normal range 
                without revealing your actual measurement.
              </p>
            </div>
          </div>
        )}
        
        {/* Fields for Vaccination Proof */}
        {proofType === 'vaccination' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="vaccinations">Your Vaccinations (Hidden from Verifier)</Label>
              <Input
                id="vaccinations"
                placeholder="e.g., COVID-19, Influenza, Hepatitis B"
                value={vaccinations}
                onChange={(e) => setVaccinations(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Comma-separated list of your vaccinations (private)
              </p>
            </div>
            
            <div>
              <Label htmlFor="required-vaccination">Vaccination to Prove (Public)</Label>
              <Select 
                value={requiredVaccination} 
                onValueChange={setRequiredVaccination}
              >
                <SelectTrigger id="required-vaccination">
                  <SelectValue placeholder="Select vaccination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COVID-19">COVID-19</SelectItem>
                  <SelectItem value="Influenza">Influenza</SelectItem>
                  <SelectItem value="Hepatitis B">Hepatitis B</SelectItem>
                  <SelectItem value="Measles">Measles</SelectItem>
                  <SelectItem value="Tetanus">Tetanus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm">
                This proof will verify you've received a specific vaccination 
                without revealing your full vaccination history.
              </p>
            </div>
          </div>
        )}
        
        {/* Fields for Record Existence Proof */}
        {proofType === 'record' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="record-hash">Record Hash (Private)</Label>
              <Input
                id="record-hash"
                placeholder="e.g., 0x1234..."
                value={recordHash}
                onChange={(e) => setRecordHash(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="patient-id">Patient ID (Partially Hidden)</Label>
              <Input
                id="patient-id"
                placeholder="e.g., 12345"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="record-type">Record Type (Public)</Label>
              <Select 
                value={recordType} 
                onValueChange={setRecordType}
              >
                <SelectTrigger id="record-type">
                  <SelectValue placeholder="Select record type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical_history">Medical History</SelectItem>
                  <SelectItem value="lab_results">Lab Results</SelectItem>
                  <SelectItem value="immunizations">Immunizations</SelectItem>
                  <SelectItem value="prescriptions">Prescriptions</SelectItem>
                  <SelectItem value="allergies">Allergies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm">
                This proof will verify a specific record exists without revealing 
                its contents or compromising patient identity.
              </p>
            </div>
          </div>
        )}
        
        {/* Generated Proof Display */}
        {generatedProof && (
          <div className="border rounded-md p-4 space-y-2">
            <div className="flex justify-between">
              <h3 className="font-semibold">Generated Proof</h3>
              <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full">
                Valid
              </span>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Proof Hash:</p>
                <p className="text-xs font-mono bg-muted p-2 rounded">{proofHash}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Public Signals:</p>
                <div className="bg-muted p-2 rounded max-h-[100px] overflow-y-auto">
                  <pre className="text-xs">
                    {JSON.stringify(generatedProof.publicSignals, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button 
          onClick={handleGenerateProof} 
          disabled={isGenerating || isSubmitting}
          className="w-full sm:w-auto"
        >
          {isGenerating ? <Spinner className="mr-2" size="sm" /> : (
            <span className="material-icons mr-2 text-sm">security</span>
          )}
          Generate Proof
        </Button>
        
        {generatedProof && (
          <>
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              <span className="material-icons mr-2 text-sm">refresh</span>
              Reset
            </Button>
            
            <Button 
              variant="secondary"
              onClick={handleSubmitProof}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? <Spinner className="mr-2" size="sm" /> : (
                <span className="material-icons mr-2 text-sm">send</span>
              )}
              Submit to Blockchain
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default ZKProofGenerator;