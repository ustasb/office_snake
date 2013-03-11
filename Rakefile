YUI_JS_COMPRESSOR = 'compression/yuicompressor-2.4.7.jar'
COMBINED_JS_FILE = 'public/js/oSnake.combined.min.js'

desc 'Combine all files in js/'
task :combine_js do
  # Wrap JS in a private context.
  File.open(COMBINED_JS_FILE, 'w') do |combined_file|
    combined_file.write "(function (window) {\n"

    Dir['public/js/*'].each do |js_file|
      combined_file.write File.read(js_file) if js_file != COMBINED_JS_FILE
    end

    combined_file.write "}(window));"
  end

  # Minify the JS
  system("java -jar #{YUI_JS_COMPRESSOR} --type js #{COMBINED_JS_FILE} -o #{COMBINED_JS_FILE} --charset utf-8")
end
