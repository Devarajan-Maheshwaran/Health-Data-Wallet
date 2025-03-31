import React, { useState } from 'react';
import { ZKProofGenerator } from '@/components/ZKProofGenerator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

/**
 * Privacy Center page with Zero-Knowledge Proof tools
 */
const PrivacyCenter = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('proofs');
  
  // Handle downloading privacy report
  const handleDownloadReport = () => {
    // In a real implementation, this would generate a proper privacy report
    toast({
      title: 'Privacy Report',
      description: 'Your privacy report is being generated and will download shortly.',
    });
    
    // Simulate download delay
    setTimeout(() => {
      toast({
        title: 'Download Complete',
        description: 'Your privacy report has been downloaded.',
      });
    }, 2000);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Privacy Center</h1>
        <p className="text-muted-foreground">
          Manage your privacy settings and generate zero-knowledge proofs
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="proofs">ZK Proofs</TabsTrigger>
          <TabsTrigger value="settings">Privacy Settings</TabsTrigger>
          <TabsTrigger value="audit">Privacy Audit</TabsTrigger>
        </TabsList>
        
        <TabsContent value="proofs" className="space-y-4">
          <ZKProofGenerator />
          
          <Card>
            <CardHeader>
              <CardTitle>Privacy Protection with Zero-Knowledge Proofs</CardTitle>
              <CardDescription>
                How ZK proofs protect your sensitive medical information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">What are Zero-Knowledge Proofs?</h3>
                  <p className="text-sm">
                    Zero-Knowledge Proofs (ZKPs) are cryptographic methods that allow one party to prove to another 
                    that a statement is true without revealing any additional information beyond the validity of 
                    the statement itself.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">How We Use ZK Proofs</h3>
                  <p className="text-sm">
                    Our platform uses ZK proofs to allow you to share verifiable health information without revealing 
                    sensitive details. For example, you can prove your blood pressure is within a normal range without 
                    revealing the exact measurement.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Benefits of ZK Proofs</h3>
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    <li>Maintain privacy while proving compliance</li>
                    <li>Selective disclosure of health information</li>
                    <li>Prove vaccination status without revealing personal details</li>
                    <li>Prove age-related qualifications without revealing birthdate</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Example Use Cases</h3>
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    <li>Insurance eligibility without revealing full medical history</li>
                    <li>Proving fitness for employment without disclosing specific test results</li>
                    <li>Verifying medication adherence without revealing which medications</li>
                    <li>Proving healthcare compliance for travel without revealing all personal information</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Configure how your health data is shared and accessed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="font-medium">Enable Zero-Knowledge Proofs</h3>
                    <p className="text-sm text-muted-foreground">
                      Use ZK proofs when sharing health information with third parties
                    </p>
                  </div>
                  <div className="flex items-center h-5">
                    <input
                      id="enable-zk"
                      type="checkbox"
                      defaultChecked={true}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="font-medium">Anonymous Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Allow anonymous data usage for medical research
                    </p>
                  </div>
                  <div className="flex items-center h-5">
                    <input
                      id="enable-analytics"
                      type="checkbox"
                      defaultChecked={false}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="font-medium">Enhanced Security Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      Require additional verification for sensitive operations
                    </p>
                  </div>
                  <div className="flex items-center h-5">
                    <input
                      id="enable-security"
                      type="checkbox"
                      defaultChecked={true}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="font-medium">Emergency Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Allow emergency access to critical health information via QR code
                    </p>
                  </div>
                  <div className="flex items-center h-5">
                    <input
                      id="enable-emergency"
                      type="checkbox"
                      defaultChecked={true}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Button variant="default" className="w-full sm:w-auto">
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Audit</CardTitle>
              <CardDescription>
                Review how your data has been accessed and by whom
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="rounded-md border">
                  <div className="bg-muted px-4 py-2 font-medium">Access History</div>
                  <div className="divide-y">
                    <div className="px-4 py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">Dr. Sarah Johnson</p>
                        <p className="text-sm text-muted-foreground">
                          Accessed medical history via ZK proof
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        March 28, 2025
                      </div>
                    </div>
                    <div className="px-4 py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">Memorial Hospital</p>
                        <p className="text-sm text-muted-foreground">
                          Emergency access via QR code
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        March 15, 2025
                      </div>
                    </div>
                    <div className="px-4 py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">HealthInsure Co.</p>
                        <p className="text-sm text-muted-foreground">
                          Verified vaccination status (ZK proof only)
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        March 10, 2025
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleDownloadReport} className="w-full sm:w-auto">
                    Download Privacy Report
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Request Data Deletion
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrivacyCenter;