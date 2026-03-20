<?php
namespace app\controller;

use app\BaseController;

/**
 * 文件上传控制器
 */
class Upload extends BaseController
{
    /**
     * 上传图片
     */
    public function image()
    {
        try {
            $file = request()->file('file');
            
            if (!$file) {
                return json(['code' => 400, 'message' => '请选择要上传的文件']);
            }
            
            // 生成保存路径
            $savePath = public_path() . 'storage' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR;
            $dateDir = date('Ymd');
            $fullPath = $savePath . $dateDir;
            
            // 创建目录
            if (!is_dir($fullPath)) {
                mkdir($fullPath, 0755, true);
            }
            
            // 生成文件名
            $ext = strtolower($file->getOriginalExtension());
            $fileName = md5(uniqid() . microtime()) . '.' . $ext;
            
            // 移动文件
            $file->move($fullPath, $fileName);
            
            // 返回访问路径
            $url = '/storage/images/' . $dateDir . '/' . $fileName;
            
            return json([
                'code' => 200,
                'message' => '上传成功',
                'data' => [
                    'url' => $url,
                    'path' => $dateDir . '/' . $fileName
                ]
            ]);
            
        } catch (\Exception $e) {
            return json(['code' => 500, 'message' => '上传失败：' . $e->getMessage()]);
        }
    }
}
