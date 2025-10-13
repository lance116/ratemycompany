import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface AuraComparisonPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuraComparisonPopup = ({ isOpen, onClose }: AuraComparisonPopupProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4">
            Which SWE internship has more aura?
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground mb-6">
            Help us rank the most prestigious and impactful SWE internships.
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6 overflow-hidden">
          <Play className="h-12 w-12 text-gray-400 dark:text-gray-600 absolute z-10" />
          <span className="text-gray-500 dark:text-gray-400 text-sm absolute bottom-4">Video Coming Soon</span>
          <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-gray-700 dark:text-gray-300">
            Placeholder Video
          </div>
        </div>
        
        {/* Action Button */}
        <Button 
          className="w-full"
          onClick={onClose}
        >
          Let's start!
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AuraComparisonPopup;
