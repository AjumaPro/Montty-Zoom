# Script to replace console.log/alert with logger calls
# This script helps identify and replace console statements with proper logging

echo "🔍 Finding console.log and alert calls..."

# Find all console.log calls
echo ""
echo "Console.log calls found:"
grep -r "console\.log" web-app/src --include="*.js" --include="*.jsx" | wc -l

# Find all alert calls
echo "Alert calls found:"
grep -r "alert(" web-app/src --include="*.js" --include="*.jsx" | wc -l

echo ""
echo "📝 Recommendations:"
echo "1. Replace console.log with appropriate logger calls"
echo "2. Replace alert() with toast notifications (react-toastify)"
echo "3. Use logger levels: logger.info(), logger.warn(), logger.error(), logger.debug()"
echo ""
echo "Example replacements:"
echo "  console.log('Info') → logger.info('Info')"
echo "  console.error('Error') → logger.error('Error')"
echo "  alert('Message') → toast.error('Message') or toast.info('Message')"
echo ""
echo "Note: This is a manual process. Review each file and replace appropriately."

